import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/@auth/auth.service';
import { InitUserService } from 'src/app/@auth/init-user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit{
  loggedIn:boolean=false;
  
  userName:String;
  fullName:String;
  img:String;
  constructor(protected authService:AuthService,protected initUserService:InitUserService,protected route:Router){
   
  }
  ngOnInit(): void {
    this.initUserService.getUser().subscribe(user=>{
      console.log(user);
        if(user!=null){
          this.userName =user.givenName;
          this.fullName = user.fullName;
         this.img =user.img;
        }
    });

    this. authService.isAuthenticated().subscribe(loggedin=>{
      console.log();
      this.loggedIn = loggedin;
      if(loggedin){
        this.initUserService.initCurrentUser();
      }
    });
    
  }
  loginWithGoogle(){
    this.authService.loginWithGoogle();
  }

  logout(){
    console.log("logout")
   // this.authService.logout();
   window.location.href="/auth/logout";
  //  window.location.reload();
  }
}
