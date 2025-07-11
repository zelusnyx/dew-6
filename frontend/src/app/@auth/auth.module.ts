import { NgModule, ModuleWithProviders } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormControl, FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { AuthComponent } from "./auth.component";
import { LoginComponent } from "./components/login/login.component";
import { CoreModule } from "../@core/core.module";
import { AuthRoutingModule } from "./auth-routing.module";
import { GoogleOAuth2CallbackComponent } from "./components/googlecallback/google-oauth2-callback.component";
import { GoogleDriveCallbackComponent } from "./components/googledrivecallback/google-drive-callback.component";
import { GoogleRegistrationComponent } from "./components/googleregistration/google-registration.component";
import { AuthResult } from "./auth-result";
import { InitUserService } from "./init-user.service";
import { LogoutComponent } from "./components/logout/logout.component";
// import { SphereLoginComponent } from "./components/sphere-login/sphere-login.component";
// import { SphereAuthService } from "./sphere-auth.service";
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    CoreModule,
    AuthRoutingModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule
  ],
  declarations: [
    AuthComponent,
    LoginComponent,
    GoogleOAuth2CallbackComponent,
    GoogleDriveCallbackComponent,
    GoogleRegistrationComponent,
    LogoutComponent
    // SphereLoginComponent  // Temporarily disabled
  ],
  exports: [
    AuthComponent,
    LoginComponent,
    GoogleOAuth2CallbackComponent,
    GoogleDriveCallbackComponent,
    GoogleRegistrationComponent,
    LogoutComponent
    // SphereLoginComponent  // Temporarily disabled
  ]
})
export class AuthModule {
  static forRoot(): ModuleWithProviders<AuthModule> {
    return {
      ngModule: AuthModule,
      providers: [AuthService, AuthGuard],
    };
  }
}
