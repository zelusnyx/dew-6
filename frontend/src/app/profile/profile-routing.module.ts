import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { PageNotFound } from './error/error.component';
import { ProfileComponent } from './profile.component';

const routes: Routes = [{
  path: '',
  component: ProfileComponent,
  children: [
    {
      path: 'accounts',
      loadChildren: () => import('./accounts/accounts.module')
        .then(m => m.AccountsModule),
    },
    {
      path: '**',
      component:PageNotFound,
    },
  ],
}];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProfileRoutingModule {}
