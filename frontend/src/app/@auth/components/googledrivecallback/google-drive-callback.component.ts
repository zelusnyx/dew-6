import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { takeWhile } from 'rxjs/operators';
import { AuthService } from '../../auth.service';
import { AuthResult } from '../../auth-result';
import { InitUserService } from '../../init-user.service';

@Component({
  selector: 'google-drive-callback',
  template: `
  <div>
    <div>Authorizing...</div>
  </div>
`,
  styleUrls: ['./google-drive-callback.component.scss']
})
export class GoogleDriveCallbackComponent implements OnDestroy {

  alive = true;
  name:string='';
  constructor(private authService: AuthService,private router: Router,private initUserService:InitUserService) {
    var params = {}
    window.location.hash.substr(1).split('&').map(hk => { 
      let temp = hk.split('='); 
        params[temp[0]] = temp[1] 
    });
    this.authService.setCookie("drive_token",params["access_token"],3600, true)
    window.close()
  }

  ngOnDestroy(): void {
    this.alive = false;
  }
}