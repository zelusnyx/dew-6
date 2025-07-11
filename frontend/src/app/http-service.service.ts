/*
 * Copyright (c) Akveo 2019. All Rights Reserved.
 * Licensed under the Single Application / Multi Application License.
 * See LICENSE_SINGLE_APP / LICENSE_MULTI_APP in the 'docs' folder for license information on type of purchased license.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';


@Injectable()
export class HttpService {

  
  get apiUrl(): string {
    return environment.apiUrl;
  }

  constructor(private http: HttpClient) {
   
  }


  get(endpoint: string, options?,flag:boolean=false): Observable<any> {
   return this.http.get(`${this.apiUrl}/${endpoint}`, options);
  }
  

  post(endpoint: string, data, options?): Observable<any> {
    return this.http.post(`${endpoint}`, data, options);
  }

  put(endpoint: string, data, options?): Observable<any> {
    return this.http.put(`${this.apiUrl}/${endpoint}`, data);
  }

  patch(endpoint: string, data, options?): Observable<any> {
    return this.http.patch(`${endpoint}`, data, options);
  }

  delete(endpoint: string, options?): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${endpoint}`,options);
  }

}
