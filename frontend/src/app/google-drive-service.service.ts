import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from '../app/@auth/auth.service';

@Injectable()
export class GoogleDriveService {

  
  get apiUrl(): string {
    return environment.apiUrl;
  }

  constructor(private http: HttpClient, private authService: AuthService) {
  }


  upload(fileContent: string, id: string, name: string, options?): Observable<any>{
    return this.http.patch('https://www.googleapis.com/upload/drive/v3/files/'+id+'?uploadType=media',fileContent,{ headers: { 'Content-Type': 'text/plain', 'Authorization': 'Bearer '+ this.authService.getCookie("token")}});
  }

  update(id: string, fileContent: string, options?): Observable<any> {
    return this.http.patch('https://www.googleapis.com/upload/drive/v3/files/'+id+'?uploadType=media',fileContent,{ headers: { 'Content-Type': 'text/plain', 'Authorization': 'Bearer '+ this.authService.getCookie("token")}});
  }

  create(name: string, options?): Observable<any> {
    return this.http.post('https://www.googleapis.com/drive/v3/files',{name: name},{ headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer '+ this.authService.getCookie("token")}});
  }
}
