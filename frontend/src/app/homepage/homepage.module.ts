
import { NgModule} from "@angular/core";
import { HomePageRoutingModule } from './homepage-routing.module';
import { HomePageComponent } from './homepage.component';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../@core/core.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PageNotFound } from './error/error.component';

@NgModule({
  exports:[HomePageComponent],
  declarations: [
    HomePageComponent,
    PageNotFound
  ],
  imports: [
    HomePageRoutingModule,
    CommonModule,
    CoreModule,
    DashboardModule,
  ]
})
export class HomePageModule {}
