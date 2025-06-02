import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { AuthService } from "src/app/@auth/auth.service";
import { StateService } from "../../state-service.service";
import { HttpService } from "src/app/http-service.service";

@Component({
  selector: "hlbparser",
  templateUrl: "./hlpparser.component.html",
  styleUrls: ["./hlpparser.component.scss"],
})
export class HLBParserComponent implements OnInit {
  viewFlag:boolean=false;
  viewID:Number=1;
  experimentId: Number = -1;
  experimentControl:Number = 4;
  constructor(
    private route: ActivatedRoute,
    private router:Router,
    protected http: HttpService,
    private state: StateService
  ) {}
  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params["id"] != "") {
        var input = {
          id: params["id"],
        };
        
        this.experimentId = params["id"];
        this.state.setExperimentId(this.experimentId);
        this.state.enableLoader();
        this.http
          .post("api/v1/pr/persist/experiment/control", input,{withCredential:true})
          .subscribe((controlData) => {
            if(controlData.code!= undefined && controlData.code!=null){
            this.state.setExperimentControl(controlData.code);
            this.experimentControl = controlData.code;
            console.log(this.experimentControl)
        this.http
          .post("api/v1/pr/persist/getExperimentById", input,{withCredential:true})
          .subscribe((data) => {
            var serverData = {};
            serverData['actors'] = data.actors;
            serverData['name'] = data.name;
            serverData['behaviors'] = data.behaviors;
            serverData['bindings'] = data.bindings;
            serverData['constraints'] = data.constraints;

            this.enableView();
            this.state.setActors(data.actors);
            this.state.setExperimentName(data.name);
            this.state.setExperimentDescription(data.description);
            this.state.setBehavior(data.behaviors);
            this.state.setBindings(data.bindings);
            this.state.setConstraints(data.constraints);
            this.state.setDriveId(data.driveId);
            this.state.setLocalServerData(serverData);
           this.state.disableLoader();
          });
        }else{
          alert("Don't have control for this experiment");
          this.router.navigate(['dashboard']);
        }
        });
     
         
        return "";
      }else{
        this.enableView();
      }
    });

  }

  enableView(){ 
  this.viewFlag = true;
  }
  show(viewId){
      this.state.setCurrentViewId(viewId);
      this.viewID = viewId;
  }
  isViewEnable():boolean{return this.viewFlag;}

  onKeyDown($event): void {
    // Detect platform
    if(navigator.platform.match('Mac')){
        this.handleMacKeyEvents($event);
    }
    else {
        this.handleWindowsKeyEvents($event); 
    }
  }

  handleMacKeyEvents($event) {
    // MetaKey documentation
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/metaKey
    let charCode = String.fromCharCode($event.which).toLowerCase();
    if ($event.metaKey && charCode === 's') {
        // Action on Cmd + S
        
        $event.preventDefault();
        this.state.triggerSaveEvent();
    } 
  }

  handleWindowsKeyEvents($event) {
    let charCode = String.fromCharCode($event.which).toLowerCase();
    if ($event.ctrlKey && charCode === 's') {
        // Action on Ctrl + S
        $event.preventDefault();
        this.state.triggerSaveEvent();
    } 
  }

  handleSlideNavigation(viewId: Number){
    this.show(viewId)
  }
}
