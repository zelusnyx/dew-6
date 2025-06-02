import { BehaviorSubject, Observable, of, Subject } from "rxjs";
import { Injectable } from "@angular/core";
import { AuthService } from "./auth.service";
import { HttpService } from "../http-service.service";
import { StateService } from "../state-service.service";

@Injectable({
  providedIn: "root",
})
export class InitUserService {
  login: boolean = false;
  constructor(
    protected http: HttpService,
    protected authService: AuthService,
    private state: StateService
  ) {}
  user: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  getUser(): Observable<any> {
    return this.user.asObservable();
  }

  getUserDetailForRegistration(id): Promise<any> {
    return new Promise((resolve, reject) => {
      var param = {
        token: id,
      };
      this.http
        .post("/api/v1/p/user/getgoogleuserinfo/", param,{withCredential:true})
        .subscribe((data) => {
          // console.log(data);
          resolve(data);
        });
    });
  }
  initCurrentUser() {
    
      var param = {
        token: this.authService.getToken(),
      };
      this.state.enableLoader();
      this.http.post("/api/v1/p/user/getuserinfo/", param).subscribe((data) => {
        console.log(data);
        this.state.disableLoader();
        this.user.next(data);
      },
      (error)=> {
        this.authService.refreshToken();
        this.initCurrentUser();
      });
   
  }

  registerUser(params): Observable<any> {
    var t = new Subject();
    this.http.post("api/v1/p/user/registerUser/", params,{withCredential:true}).subscribe(data=>{

      if(data.message!=undefined && data.message!=null){
        this.authService.setCookie("token",params.token, 3599, false);   t.next(true);
      }else{
        t.next(false);
      }
   
      this.state.disableLoader();
    });

    return t;
  }
  checkHandle(params): Observable<any> {

    var t = new Subject();
    this.state.enableLoader();
    this.http.post("api/v1/p/user/validateUserHandle/", params,{withCredential:true}).subscribe(data=>{
      t.next(data);
      this.state.disableLoader();
    });
    return t ; 
  }
}
