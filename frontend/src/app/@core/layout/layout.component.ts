import { Component } from '@angular/core';
import { AuthService } from 'src/app/@auth/auth.service';
import { InitUserService } from 'src/app/@auth/init-user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
  loggedIn:boolean=false;
  
  userName:String;
  fullName:String;
  userHandle:String;
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
         this.userHandle = user.userHandle;
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
  closeMenu(){
    this.menuFlag=false;
  }
  logout(){
    console.log("logout")
   // this.authService.logout();
   window.location.href="/auth/logout";
  //  window.location.reload();
  }
  menuFlag:boolean=false;
   toggle(){
    this.menuFlag=!this.menuFlag;
   }

}
