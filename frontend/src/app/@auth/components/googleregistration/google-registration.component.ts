/*
 * Copyright (c) Akveo 2019. All Rights Reserved.
 * Licensed under the Single Application / Multi Application License.
 * See LICENSE_SINGLE_APP / LICENSE_MULTI_APP in the 'docs' folder for license information on type of purchased license.
 */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { AuthService } from "../../auth.service";
import { takeWhile } from "rxjs/operators";
import { AuthResult } from "../../auth-result";
import { promise } from 'protractor';
import { InitUserService } from '../../init-user.service';
import { HttpService } from 'src/app/http-service.service';
import { StateService } from 'src/app/state-service.service';

@Component({
  selector: "google-registration",
  templateUrl: "./google-registration.component.html",
  styleUrls: ["google-registration.component.scss"]
})
export class GoogleRegistrationComponent implements OnInit {
  alive: boolean = true;
  emailId: string = "";
  fullName:string="";
  userHandle:string="";
  institution:string="";
  active:boolean=false;
  userHandleExist:boolean=false;
  token:string;
  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected userService: InitUserService,
    private changeDetection: ChangeDetectorRef
  ) {}

  ngOnInit() :Promise<any>{
    this.route.params.subscribe((params) => {
      if (params["id"] != "") {
        console.log(params["id"] );
        this.token = params["id"] ;
    return this.userService.getUserDetailForRegistration(params["id"] ).then(
      data=>{
      this.fullName = data.fullName;
      this.emailId = data.emailId;
        this.enableUI();
        
     
      }
    );
  }
});

return null;
  }


  enableUI(){
  this.alive=false;
  console.log(this.alive);
  this.changeDetection.detectChanges();
  }

  cancel(){
    this.router.navigate(['auth/login']);
  }

  register(){
    if(this.validate()){
      var params = {
        handle:this.userHandle,
        token: this.token
      }

      this.userService.registerUser(params).subscribe(flag=>{
        if(flag)
          this.router.navigate(['dashboard']);
          else{
            alert("Error: Please try again");
            this.router.navigate(['auth/login']);
          }
      });
      //this.state.enableLoader();
      
    }
  }
  isExist():boolean{return this.userHandleExist;}
  validate():boolean{  let pattern = /^[a-zA-Z0-9_]+$/i
    return pattern.test(this.userHandle);}
  checkHandle(){

    if(this.validate()){
      var params = {
        handle:this.userHandle
      }
      //this.state.enableLoader();
      this.userService.checkHandle(params).subscribe(data=>{
        //this.state.disableLoader();
        this.active = data.valid;
        this.userHandleExist = !data.valid;
      });
    }else{
      this.active=false;
    }
   
  }

  enablePassword(){
    
  }

  isEnable():boolean{
    return this.active && this.institution.trim() !='';
  }
}
