import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { PageNotFound } from './error/error.component';
import { HomePageComponent } from './homepage.component';

const routes: Routes = [{
  path: '',
  component: HomePageComponent,
  children: [
    {
      path: '',
      loadChildren: () => import('./dashboard/dashboard.module')
        .then(m => m.DashboardModule),
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
export class HomePageRoutingModule {}
