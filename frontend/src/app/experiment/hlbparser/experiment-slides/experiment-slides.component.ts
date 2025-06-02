import { Component, OnInit, Inject, Input, Output, ViewChild, HostListener, EventEmitter } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatSnackBar } from '@angular/material';
import { Subject } from 'rxjs';
import { HttpService } from "src/app/http-service.service";
import { StateService } from "src/app/state-service.service";
import { SingleSlideComponent } from "./single-slide.component";


@Component({
  selector: "experiment-slides",
  templateUrl: "experiment-slides.component.html",
  styleUrls: ['./experiment-slides.component.scss']
})
export class ExperimentSlides implements OnInit {
	@Input() experimentId: Number;
	@Output() navigate: EventEmitter<any> = new EventEmitter();
	slides: any = [];
	lastSequenceNumber = 0;

  constructor(
    protected http: HttpService,
    protected state: StateService,
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private formBuilder: FormBuilder
  ) {
  }

  public ngOnInit(): void {
  	console.log("experimentId : ", this.experimentId)
    if (this.experimentId > 0) { 
      // code...
      this.getSlideDetails();
    } else {
      // code...
      this._snackBar.open("Please save the experiment to continue!", "OK", {
        duration: 10000,
      });
    }
  }


  showTopology(){
  	this.navigate.emit(5);
  }

  private  extractScenario(scenario) {
    // console.log(scenario);
    // this.bindingMap = new Map<String,any>();
    const trigger = [];
    var parsedEvents = {};
    scenario.forEach((element) => {
      if (element[0] != null) {
        element[0].map((x) => {
          if (!trigger.includes(x) && !parsedEvents[x]) {
            trigger.push({key: x, category: 't_event', value: ''});
            parsedEvents[x] = true
          }
        });
      }

      if (element[2] != null) {
        element[2].map((x) => {
          if (!trigger.includes(x)  && !parsedEvents[x]) {
            trigger.push({key: x, category: 'action', value: ''});
            parsedEvents[x] = true
          }
        });
      }

      if (element[3] != null) {
        element[3].map((x) => {
          if (!trigger.includes(x)  && !parsedEvents[x]) {
            trigger.push({key: x, category: 'event', value: ''});
            parsedEvents[x] = true
          }
        });
      }
    });
    this.state.setBindings(trigger);
  }

  updateBindings(){
    const data = {
      ParseType: 'bash',
      Scenario: [],
      Constraints: [],
    };
    this.state.getBehavior().subscribe(d => {
      data.Scenario = d
    });
    this.state.getConstraints().subscribe(d => {
      data.Constraints = d
    });
    this.http
      .put('v1/pr/hlb/parse', data, { withCredential: true })
      .subscribe((receivedData: ParseApiBean) => {
        this.extractScenario(receivedData.parsedScenario);
      });
  }

  showDependencyGraph(){
    if(this.experimentId < 1){
      this._snackBar.open("Please save the experiment to continue!", "OK", {
        duration: 10000,
      });
    } else {
      this.http.get("v1/pr/design/experiment/slides/"+this.experimentId + "/dew", {withCredential: true}).subscribe((response) => {
        this.state.setBehavior(response['behaviors']);
        this.state.setBindings(response['bindings']);
        // this.updateBindings();
        this.navigate.emit(2);
      })
    }
  }

  createSlide(){
    if(this.experimentId < 1){
      this._snackBar.open("Please save the experiment to continue!", "OK", {
        duration: 10000,
      });
    } else {
    	this.http.post("api/v1/pr/design/experiment/slides",{"experiment_id": this.experimentId, "sequence_number": this.lastSequenceNumber + 1},{withCredential: true}).subscribe((data) => {
    		this.slides.push(data['slide'])
    		this.lastSequenceNumber += 1
        this.state.setlastSlideSeqNum(this.lastSequenceNumber);
        this.editSlide(data['slide'])
    	})
    }
  }

  deleteSlide(slide){
  	this.http.delete("v1/pr/design/experiment/slides/"+this.experimentId+"/"+slide['slide_id'], {withCredential: true}).subscribe((data) => {
  		this.slides = this.slides.filter(s => s['slide_id'] != slide['slide_id'])
  	})
  }

  dateView(timestamp){
    var d = new Date(timestamp*1000);
    return d.toLocaleString();
  }

  moveUpSlide(slide, index){
  	if(index == 0){
  		return;
  	}
  	this.http.post("api/v1/pr/design/experiment/slides/swap",{"experiment_id": this.experimentId, "first_slide_id": slide['slide_id'].toString(), "second_slide_id": this.slides[index-1]['slide_id'].toString()},{withCredential: true}).subscribe((data) => {
  		var second_slide = this.slides[index-1]
  		var s = slide['sequence_number']
  		slide['sequence_number'] = second_slide['sequence_number']
  		second_slide['sequence_number'] = s
  		this.slides[index-1] = slide
  		this.slides[index] = second_slide

  	})
  	console.log(this.slides)
  }

  moveDownSlide(slide, index){
  	if(index == this.slides.length - 1){
  		return;
  	}
  	this.http.post("api/v1/pr/design/experiment/slides/swap",{"experiment_id": this.experimentId, "first_slide_id": slide['slide_id'].toString(), "second_slide_id": this.slides[index+1]['slide_id'].toString()},{withCredential: true}).subscribe((data) => {
  		var second_slide = this.slides[index+1]
  		var s = slide['sequence_number']
  		slide['sequence_number'] = second_slide['sequence_number']
  		second_slide['sequence_number'] = s
  		this.slides[index+1] = slide
  		this.slides[index] = second_slide
  	});
  	console.log(this.slides)
  }

  editSlide(slide){
    this.state.setslideTobeShown(slide);
    this.navigate.emit(6);
  }

  private getSlideDetails(){
  	this.http.get("v1/pr/design/experiment/slides/"+this.experimentId, {withCredential: true}).subscribe((response) => {
    	this.slides = response['slides']
		    this.slides.forEach((slide)=>{
	    		var num = parseInt(slide['sequence_number'])
	    		if(this.lastSequenceNumber < num){
	    			this.lastSequenceNumber = num
            this.state.setlastSlideSeqNum(num);
	    		}
	    });
    })
  }

  updateDEW(){
    this.http.get("v1/pr/design/experiment/slides/"+this.experimentId + "/dew", {withCredential: true}).subscribe((response) => {
      this.state.setBehavior(response['behaviors']);
      this.state.setBindings(response['bindings']);
    })
  }

}
