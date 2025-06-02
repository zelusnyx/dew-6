
import { NgModule} from "@angular/core";
import { ProfileRoutingModule } from './profile-routing.module';
import { ProfileComponent } from './profile.component';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../@core/core.module';
import { AccountsModule } from './accounts/accounts.module';
import { PageNotFound } from './error/error.component';
import { AccountsComponent } from './accounts/accounts.component';

@NgModule({
  exports:[ProfileComponent],
  declarations: [
    ProfileComponent,
    PageNotFound
  ],
  imports: [
    ProfileRoutingModule,
    CommonModule,
    CoreModule,
    AccountsModule,
  ]
})
export class ProfileModule {}
