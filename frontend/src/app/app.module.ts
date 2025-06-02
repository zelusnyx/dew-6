import { BrowserModule } from "@angular/platform-browser";
import { NgModule, ErrorHandler } from "@angular/core";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { HttpService } from './http-service.service';
import { AuthModule } from './@auth/auth.module';
import { StateService } from './state-service.service';
import { LogService } from "./experiment/hlbparser/common/logging-service";
import { ErrorInterceptor } from "./error-interceptor";
import { SocialLoginModule, SocialAuthServiceConfig } from 'angularx-social-login';
import { GoogleLoginProvider } from 'angularx-social-login';
import { environment } from "environments/environment.prod";

@NgModule({
  declarations: [
    AppComponent
  ],
  entryComponents: [
  ],
  imports: [
    AuthModule.forRoot(),
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    AppRoutingModule,
    HttpClientModule,
    SocialLoginModule
  ],
  providers: [
    HttpService, 
    StateService,
    LogService,
    {
      provide: ErrorHandler,
      useClass: ErrorInterceptor
    },
    {
      provide: "SocialAuthServiceConfig",
      useValue: {
        autoLogin: true,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              environment.googleClientId
            )
          }
        ]
      } as SocialAuthServiceConfig
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
