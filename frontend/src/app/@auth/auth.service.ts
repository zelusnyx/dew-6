import { BehaviorSubject, Observable, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpService } from '../http-service.service';
import { environment } from '../../environments/environment';
import { SocialAuthService } from "angularx-social-login";
//Import angular social login providers
import { GoogleLoginProvider, SocialUser } from "angularx-social-login";
// Import SPHERE authentication service
// import { SphereAuthService } from './sphere-auth.service';

@Injectable({
    providedIn: 'root'
  })
export class AuthService {


  constructor(
    protected http:HttpService,
    protected socialAuthService: SocialAuthService,
    // protected sphereAuthService: SphereAuthService
  ){ }

  login:boolean=false;
  token:String;
  expiry:Number;
  user: SocialUser;
  lastTime: number;
  currentTime: number;

  startSession(id): Observable<any> {

      var param = {
        token:id
      }
     return this.http.post('/api/v1/p/user/validateUser/',param,{withCredential:true});

  }
  authenticate(userData: any):Observable<any> {
    this.token = userData.authToken;
    this.expiry = Number(3500);
    return this.startSession(this.token);
  }

  setRefreshTokenIntervals() {

    //Code to Refresh Access Tokens
    setInterval(()=> {
      this.refreshToken();
    }, (60 * 5 * 1000)); //Refresh Token every 5 mins

    //Code to detect if the Computer woke up
    this.lastTime = (new Date()).getTime();
    setInterval(() => {
      this.currentTime = (new Date()).getTime();
      if (this.currentTime > (this.lastTime + (60*1*1000) + (60*1*1000))) { //Check if the computer is awake every min. Ignore small delays.
        // Probably just woke up!
        this.refreshToken();
      }
      this.lastTime = this.currentTime;
    }, (60*1*1000));

  }

  refreshToken() {
    try {
      this.socialAuthService.authState.subscribe((user) => {
        this.user = user;
        this.login = (user != null);
      });
      this.socialAuthService.refreshAuthToken(GoogleLoginProvider.PROVIDER_ID).then(() => {
        try {
          this.token = this.user.authToken;
          this.expiry = 3500;
          this.setCookie("token", this.token, this.expiry, false);
        } catch (ex) {
          //Do nothing
        }
      });
    } catch (ex) {
      //Do nothing
    }
  }


  enableAuthentication(){
    this.isAuthenticate.next(true);
    this.setCookie("token",this.token,this.expiry, false);
  }
  getToken() {
    return this.token;
  }
  onAuthenticationChange():Observable<any> {
    throw new Error("Method not implemented.");
  }
    isAuthenticate:BehaviorSubject<boolean> = new BehaviorSubject(false);

  isAuthenticated():Observable<boolean>{
   return  of(this.checkAuthentication())
  }
  checkAuthentication(): boolean {
    //console.log("check");
    if(!this.isAuthenticate.value){
      var token = this.getCookie("token");
      //console.log(token);
       if(token!=""){
         this.isAuthenticate.next(true);
         this.token =token;
         return true;
       }else{
         return false;
       }
    }else{
      return true;
  }
}

   setCookie(key, value, seconds, withExpiry) {
     //console.log(key+"::"+value);
    var date = new Date();
    var expires;
    withExpiry && date.setTime(date.getTime() + (seconds *1000));
    withExpiry && (expires = "expires="+ date.toUTCString());
    document.cookie = key + "=" + value + ";" + (withExpiry ? expires + ";" : "") + "path=/";
  }

  getCookie(key) {
    var name = key + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  loginWithGoogle() {
    return new Promise((resolve, reject) => {
      try {
        this.socialAuthService.authState.subscribe((user) => {
          this.user = user;
          this.login = (user != null);
        });
        this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID).then(()=> {

          resolve(this.user);
        }).catch(()=> {
          reject(false);
        });
      } catch(exception) {
        reject(false);
      }
    });

  }

  authorizeGoogleDrive(experiment_id){
    const scopes = [
      "email",
      "profile",
      "openid",
      encodeURIComponent("https://www.googleapis.com/auth/userinfo.profile"),
      encodeURIComponent("https://www.googleapis.com/auth/drive.file")
    ]
    var apiurl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${environment.googleClientId}&response_type=token&state=${experiment_id}&scope=${scopes.join("%20")}&redirect_uri=${encodeURIComponent(environment.googleDriveRedirectUrl)}&include_granted_scopes=true`
    var popupWindow = window.open(apiurl, 'authorize')
    var prom = (resolve) => {
      if(popupWindow.closed)
      {
        resolve();
      } else {
        setTimeout(_ => prom(resolve), 1000)
      }
    }
    return new Promise(prom)
  }

  /**
   * Login to SPHERE with username and password - TEMPORARILY DISABLED
   */
  loginWithSphere(username: string, password: string): Promise<any> {
    return Promise.reject('SPHERE authentication temporarily disabled');
  }

  /**
   * Check if user is authenticated to SPHERE - TEMPORARILY DISABLED
   */
  isSphereAuthenticated(): boolean {
    return false;
  }

  /**
   * Get SPHERE authentication token - TEMPORARILY DISABLED
   */
  getSphereToken(): string | null {
    return null;
  }

  /**
   * Get observable for SPHERE authentication state - TEMPORARILY DISABLED
   */
  getSphereAuthState(): Observable<boolean> {
    return of(false);
  }

  logout() {
    try {
      this.isAuthenticate.next(false);
      this.login = false;
      this.token="";
      this.setCookie("token","",0, true);
      this.setCookie("emailId","",0, true);
      this.setCookie("fullName","",0, true);
      this.setCookie("givenName","",0, true);
      this.setCookie("lastName","",0, true);
      this.setCookie("img","",0, true);
      this.setCookie("userHandle","",0, true);

      // Logout from Google OAuth
      this.socialAuthService.authState.subscribe((user) => {
        this.user = user;
        this.login = (user != null);
      });
      this.socialAuthService.signOut(true);

      // SPHERE logout temporarily disabled
    } catch (ex) {
      //Do nothing
    }
  }
}
