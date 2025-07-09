import { NgModule, ModuleWithProviders } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormControl, FormsModule } from "@angular/forms";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { AuthComponent } from "./auth.component";
import { LoginComponent } from "./components/login/login.component";
import { CoreModule } from "../@core/core.module";
import { AuthRoutingModule } from "./auth-routing.module";
import { GoogleOAuth2CallbackComponent } from "./components/googlecallback/google-oauth2-callback.component";
import { GoogleDriveCallbackComponent } from "./components/googledrivecallback/google-drive-callback.component";
import { AuthResult } from "./auth-result";
import { InitUserService } from "./init-user.service";
import { LogoutComponent } from "./components/logout/logout.component";
import { SphereLoginComponent } from "./components/sphere-login/sphere-login.component";
import { SphereAuthService } from "./sphere-auth.service";
import {
  MatCard,
  MatLabel,
  MatFormField,
  MatInput,
  MatInputModule,
  MatCardModule,
  MatButtonModule,
  MatIconModule,
} from "@angular/material";
import { BrowserModule } from "@angular/platform-browser";
import { GoogleRegistrationComponent } from './components/googleregistration/google-registration.component';
import { StateService } from '../state-service.service';
import { HttpService } from '../http-service.service';

@NgModule({
  exports: [AuthComponent],

  declarations: [
    AuthComponent,
    LoginComponent,
    GoogleOAuth2CallbackComponent,
    GoogleDriveCallbackComponent,
    LogoutComponent,
    GoogleRegistrationComponent,
    SphereLoginComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CoreModule,
    AuthRoutingModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule
  ]
})
export class AuthModule {
  static forRoot(): ModuleWithProviders<AuthModule> {
    return {
      ngModule: AuthModule,
      providers: [AuthService, AuthGuard, SphereAuthService],
    };
  }
}
