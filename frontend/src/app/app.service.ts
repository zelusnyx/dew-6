

import { Injectable } from '@angular/core';
import { StateService } from './state-service.service';
import { Router } from '@angular/router';

@Injectable()
export class AppService {

  constructor(private state:StateService){}
  load(){
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('user');
      console.log(username);

      var userDetails = {
        name:"",
        userId:""
      }

      if(username == "shabbirm"){
      userDetails.name = "shabbir";
      userDetails.userId= username
      }else{
        userDetails = null;
      }
      this.state.setUserDetails(userDetails);


  }
  
}
