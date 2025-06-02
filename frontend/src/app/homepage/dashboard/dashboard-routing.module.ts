
import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { AuthGuard } from 'src/app/@auth/auth.guard';
import { DashboardComponent } from './dashboard.component';

const routes: Routes = [
  {
    path: "",
   // canActivateChild: [AuthGuard],
    component: DashboardComponent
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule {}
