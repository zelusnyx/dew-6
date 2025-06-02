/*
 * Copyright (c) Akveo 2019. All Rights Reserved.
 * Licensed under the Single Application / Multi Application License.
 * See LICENSE_SINGLE_APP / LICENSE_MULTI_APP in the 'docs' folder for license information on type of purchased license.
 */

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanActivateChild, CanLoad} from '@angular/router';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import {AuthService} from './auth.service';
import { StateService } from '../state-service.service';

@Injectable()
export class AuthGuard implements CanActivate {
  // canLoad(route: import("@angular/router").Route, segments: import("@angular/router").UrlSegment[]): boolean | Observable<boolean> | Promise<boolean> {
  //   return this.authService.authenticated.pipe(map(logged => {
  //     console.log("inside canActivateChild");
      
  //       if(logged) {
  //         this.router.navigate(['/protected']);
  //         return false;
  //       }
  //       return true;
  //     })
  //     )
  // }
 
  // canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | import("@angular/router").UrlTree | Observable<boolean | import("@angular/router").UrlTree> | Promise<boolean | import("@angular/router").UrlTree> {
  //   return this.authService.authenticated.pipe(map(logged => {
  //     console.log("inside canActivateChild");
  //       if(logged) {
  //         this.router.navigate(['/protected']);
  //         return false;
  //       }
  //       return true;
  //     })
  //     )
  // }
  constructor(private authService: AuthService, private router: Router,private state:StateService) {

  }

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.isAuthenticated().pipe(map(logged => {
      console.log("inside canActivate");
      console.log(logged);
        if(!logged) {
          this.router.navigate(['auth/login']);
          return false;
        }
        return true;
      })
      )
}
}
