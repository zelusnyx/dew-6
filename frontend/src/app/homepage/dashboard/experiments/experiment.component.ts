import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { InitUserService } from 'src/app/@auth/init-user.service';
import { HttpService } from 'src/app/http-service.service';
import { HttpHeaders } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';
import { startWith, map } from 'rxjs/operators';
import { LogService, LogHeader } from 'src/app/experiment/hlbparser/common/logging-service';

@Component({
  selector: 'experiment',
  templateUrl: './experiment.component.html',
  styleUrls: ['./experiment.component.scss']
})
export class ExperimentComponent implements OnInit{
  userInfo:any;
  show:boolean=false;
  filterSelect = new FormGroup({
    accessLevel: new FormControl(''),
    search: new FormControl('')
  });
  filteredLevels = [{name:'Read',value:'2'},{name:'Write',value:'3'},{name:'Manage',value:'4'}]
  
  experiments:any=[]
  filterExperiments:any=[]
 
  constructor(private router:Router,private http:HttpService,private initUser:InitUserService, private logger: LogService) { }

  ngOnInit() {
    this.initUser.getUser().subscribe(user=>{
     // console.log(user)
      if(user !=null){
          this.userInfo=user;
          this.load(user.userId);
          this.enableComponent();
  }
  });

  this.filterExperiments = this.filterSelect.valueChanges.pipe(
      startWith(""),
      map((value) => this._filter(value, this.experiments))
    );

  }

  private _filter(value: any, options): [] {
    console.log(value)
    if (value == 0)
    return options
    else if(value.accessLevel == '')
      return options.filter((option) =>
      option.name.toLowerCase().includes(value.search.toLowerCase()) || option.description.toLowerCase().includes(value.search.toLowerCase())
    );
      else
    return options.filter((option) =>
      option.accessLevel >= value.accessLevel
    ).filter((option) =>
    option.name.toLowerCase().includes(value.search.toLowerCase()) || option.description.toLowerCase().includes(value.search.toLowerCase())
  );
  }

  enableComponent(){
    this.show = true;
  }
  load(userId){
    this.http.get("v1/pr/persist/getExperimentList",{withCredentials: true}).subscribe(data=>{
      this.experiments = data;
     });
  }

  edit(experiments){
    // console.log(experiments)
    this.logger.log(LogHeader.INFO, "User started to edit experiment " + experiments.name + " (ID: " + experiments.experiment_id + ")");
    window.location.href = "p/e/c/"+experiments.experiment_id;
  }

  create(){
    this.logger.log(LogHeader.INFO, "User created a new experiment.");
    window.location.href = "p/e/c";
  }

  copy(item){
    this.logger.log(LogHeader.INFO, "User copied experiment " + item.name + " (ID: " + item.experiment_id + ")");
    var params = {
      "id": item.experiment_id+""
    }
    this.http.post("api/v1/pr/persist/experiment/copy",params,{withCredentials: true}).subscribe(data=>{
    
      this.edit(data);
     });
  }

 

}
