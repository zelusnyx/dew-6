import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { AuthComponent } from "./auth.component";
import { LoginComponent } from "./components/login/login.component";
import { GoogleOAuth2CallbackComponent } from './components/googlecallback/google-oauth2-callback.component';
import { GoogleDriveCallbackComponent } from './components/googledrivecallback/google-drive-callback.component';
import { LogoutComponent } from './components/logout/logout.component';
import { GoogleRegistrationComponent } from './components/googleregistration/google-registration.component';

const routes: Routes = [
  
   
      {
        path: "",
        pathMatch: 'full',
        redirectTo:'login'
        // component: LoginComponent
      },
      {
        path: "login",
        component: LoginComponent
      },
      {
        path: "googleoauth2callback",
        component: GoogleOAuth2CallbackComponent
      },{
        path: "googledrivecallback",
        component: GoogleDriveCallbackComponent
      },{
      path: "registerwithgoogle/:id",
      component: GoogleRegistrationComponent
    },{
        path: "logout",
        component: LogoutComponent
      }
   
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule {}
