
import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { AuthGuard } from 'src/app/@auth/auth.guard';
import { AccountsComponent } from './accounts.component';

const routes: Routes = [
  {
    path: "",
   // canActivateChild: [AuthGuard],
    component: AccountsComponent
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountsRoutingModule {}
