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

@Component({
  selector: 'logout',
  template: '<p> logout Successfully</p>, <a href="/">Go to home page</a>',
  //styleUrls:['login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class LogoutComponent {

 
  alive: boolean = true;

  constructor(protected authService:AuthService
   ) { 

    authService.logout();
   }


 
}
