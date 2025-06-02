
import { Component, OnDestroy } from '@angular/core';


@Component({
  selector: 'auth',
  styleUrls:['auth.component.scss'],
  template: `

              <router-outlet></router-outlet>
        
  `,
})
export class AuthComponent {

  // private alive = true;

  // subscription: any;

  // authenticated: boolean = false;
  // token: string = '';
  
  // isEnable():boolean{
  //  // //console.log(this._router.url);
  //   return this._router.url !="/auth/login";
  // }

  // // showcase of how to use the onAuthenticationChange method
  // constructor(protected auth: AuthService, private _router: Router,protected location: Location) {

  //   this.subscription = auth.onAuthenticationChange()
  //     .pipe(takeWhile(() => this.alive))
  //     .subscribe((authenticated: boolean) => {
  //       this.authenticated = authenticated;
  //     });
  // }

  // back() {
  //   this.location.back();
  //   return false;
  // }

  // ngOnDestroy(): void {
  //   this.alive = false;
  // }
}
