import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Import MergeTB API types and clients
import { IdentityClientImpl } from '@mergetb/api/portal/v1/portal';
import {
  LoginRequest,
  LoginResponse,
} from '@mergetb/api/portal/v1/identity_types';

// Simple RPC implementation for HTTP transport
class HttpRpc {
  constructor(protected baseUrl: string) {}

  async request(service: string, method: string, data: Uint8Array): Promise<Uint8Array> {
    const url = `${this.baseUrl}/api/v1/${service}/${method}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-protobuf',
        'Accept': 'application/x-protobuf'
      },
      body: data
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return new Uint8Array(await response.arrayBuffer());
  }

  clientStreamingRequest(): Promise<Uint8Array> { throw new Error('Not implemented'); }
  serverStreamingRequest(): never { throw new Error('Not implemented'); }
  bidirectionalStreamingRequest(): never { throw new Error('Not implemented'); }
}

@Injectable({
  providedIn: 'root'
})
export class SphereAuthService {
  
  private sphereToken: string | null = null;
  private identityClient: IdentityClientImpl;
  private rpc: HttpRpc;
  
  public sphereAuthState = new BehaviorSubject<boolean>(false);
  public sphereAuthState$ = this.sphereAuthState.asObservable();

  constructor() {
    this.rpc = new HttpRpc(environment.sphereApiUrl);
    this.identityClient = new IdentityClientImpl(this.rpc);
    
    this.sphereToken = this.getSphereTokenFromStorage();
    if (this.sphereToken) {
      this.sphereAuthState.next(true);
    }
  }

  loginToSphere(username: string, password: string): Observable<LoginResponse> {
    const loginRequest: LoginRequest = {
      username: username,
      password: password
    };

    return from(this.identityClient.Login(loginRequest)).pipe(
      map((response: LoginResponse) => {
        if (response.token) {
          this.sphereToken = response.token;
          this.storeSphereToken(response.token);
          this.sphereAuthState.next(true);
          console.log('SPHERE login successful');
        }
        return response;
      }),
      catchError((error) => {
        console.error('SPHERE login failed:', error);
        this.sphereAuthState.next(false);
        return throwError(error);
      })
    );
  }

  logoutFromSphere(): Observable<any> {
    this.sphereToken = null;
    this.clearSphereToken();
    this.sphereAuthState.next(false);
    
    return new Observable(observer => {
      observer.next(true);
      observer.complete();
    });
  }

  getSphereToken(): string | null {
    return this.sphereToken;
  }

  isSphereAuthenticated(): boolean {
    return this.sphereToken !== null && this.sphereToken.length > 0;
  }

  private storeSphereToken(token: string): void {
    localStorage.setItem('sphere_token', token);
  }

  private getSphereTokenFromStorage(): string | null {
    return localStorage.getItem('sphere_token');
  }

  private clearSphereToken(): void {
    localStorage.removeItem('sphere_token');
  }
} 