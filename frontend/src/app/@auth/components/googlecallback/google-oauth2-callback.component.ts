import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { takeWhile } from 'rxjs/operators';
import { AuthService } from '../../auth.service';
import { AuthResult } from '../../auth-result';
import { InitUserService } from '../../init-user.service';
import { LogHeader, LogService } from 'src/app/experiment/hlbparser/common/logging-service';

@Component({
  selector: 'google-oauth2-callback',
  template: `
  <div>
    <div>Signing in.....</div>
  </div>
`,
  styleUrls: ['./google-oauth2-callback.component.scss']
})
export class GoogleOAuth2CallbackComponent implements OnDestroy {

  alive = true;
  name:string='';
  constructor(private authService: AuthService,private router: Router,private initUserService:InitUserService, private logger: LogService) {
    this.authService.authenticate('google')
      .pipe(takeWhile(() => this.alive))
      .subscribe((authResult) => {
        console.log(authResult);
       if(authResult.navigateTo ==undefined ){
        this.authService.enableAuthentication();
        this.logger.log(LogHeader.INFO, "User successfully logged in.")
        this.router.navigate(['dashboard']);
       }else
        this.router.navigate(['auth/registerwithgoogle',this.authService.getToken()])
      },(error) => {
        alert("Invalid User. Please Try again");
        this.router.navigate(['auth/login']);
      });
  }

  ngOnDestroy(): void {
    this.alive = false;
  }
}