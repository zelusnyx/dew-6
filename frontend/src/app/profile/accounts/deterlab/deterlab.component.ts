import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { InitUserService } from 'src/app/@auth/init-user.service';
import { HttpService } from 'src/app/http-service.service';
import { HttpHeaders } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';
import { startWith, map } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'deterlab',
  templateUrl: './deterlab.component.html',
  styleUrls: ['./deterlab.component.scss']
})
export class DeterLabComponent implements OnInit{
  userInfo:any;
  show:boolean=false;
  userList = []
  userName:String = "";
  password:String = "";
  hide:boolean =true;
  constructor(private router:Router
    ,private _snackBar: MatSnackBar
    ,private http:HttpService
    ,private initUser:InitUserService){ }
  ngOnInit() {
    this.initUser.getUser().subscribe(user=>{
     // console.log(user)
      if(user !=null){
          this.userInfo=user;
          this.load();
          this.enableComponent();
  }
  });

  }

 
  enableComponent(){
    this.show = true;
  }
  load(){
    this.http.get("v1/pr/profile/accounts/deterLab/get",{withCredentials: true}).subscribe(data=>{
      this.userList = data
     });
  }

  save(){

    if(this.userName.trim()=="" ){
        alert("User name cannot be null.")
        return
    }

    if(this.password.trim()=="" ){
      alert("Password cannot be null.")
      return
  }
    let data = {
      "username":this.userName,
      "password":this.password
    }
    this.http.post("/api/v1/pr/profile/accounts/deterLab/save",data,{withCredentials: true}).subscribe(data=>{
      this._snackBar.open("Saved Successfully!", "close", {
        duration: 2000,
      });
      this.userName = ""
      this.password = ""
      this.load();
     },error=>{
      this._snackBar.open("There was some error in saving, please try again!", "close", {
        duration: 2000,
      });
     });
  }

  delete(id){
    this.http.delete("v1/pr/profile/accounts/deterLab/delete?id="+id,{withCredentials: true}).subscribe(data=>{
      this._snackBar.open("Deleted Successfully!", "close", {
        duration: 2000,
      });    
      this.load();
     },error=>{
        this._snackBar.open("There was some error in deleting, please try again!", "close", {
          duration: 2000,
        });
      });
  }

}
