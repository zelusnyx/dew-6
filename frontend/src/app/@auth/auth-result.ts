export  class AuthResult {
  protected success: boolean;
  protected token: any;
  constructor(success: boolean, token?: any){
    this.success = success;
    this.token = token;
  };
  getToken(): any{return this.token};
  isSuccess(): boolean{return this.success};
}