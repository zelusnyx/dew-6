/*
 * Copyright (c) Akveo 2019. All Rights Reserved.
 * Licensed under the Single Application / Multi Application License.
 * See LICENSE_SINGLE_APP / LICENSE_MULTI_APP in the 'docs' folder for license information on type of purchased license.
 */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { takeWhile } from 'rxjs/operators';
import { AuthResult } from '../../auth-result';
import * as $ from 'jquery';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls:['login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class LoginComponent implements OnInit {

  alive: boolean = true;
  emailId:string="";
  password:string="";
  hide:boolean=true;
  showAlternatelogin:boolean=true;
  constructor(
    protected cd: ChangeDetectorRef,
    private fb: FormBuilder,
    protected router: Router,
    protected authService:AuthService) { }

  ngOnInit(): void {
      if(this.authService.checkAuthentication()){
          this.router.navigate(['dashboard']);
    }else{
      this.alive=false;
    }
  
  }

login(){
    $('.SignInOrContent').toggleClass('hide');
    this.authService.loginWithGoogle().then((result)=> {
      this.alive=true;
      this.authService.authenticate(result).pipe(takeWhile(() => this.alive)).subscribe((authResult) => {
        $('.SignInOrContent').toggleClass('hide');
        if(authResult.navigateTo ==undefined ){
          this.authService.enableAuthentication();
          this.router.navigate(['dashboard']);
        } else {
          this.router.navigate(['auth/registerwithgoogle',this.authService.getToken()])
        }
      }, (error) => {
        alert("Invalid User. Please Try again");
        this.router.navigate(['auth/login']);
      });
    }).catch((result)=> {
      $('.SignInOrContent').toggleClass('hide');
    });
  }

  enablePassword(){
    this.showAlternatelogin=false;
  }
  disablePassword(){
    this.showAlternatelogin=true;

  }
  isAlternateLoginEnable(){
  return this.showAlternatelogin;
  }
 
}
