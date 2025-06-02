import { NgModule } from "@angular/core";
import { Routes, RouterModule, ExtraOptions } from "@angular/router";
import { AuthGuard } from './@auth/auth.guard';
const routes: Routes = [
  {
    path: 'dashboard',
    canActivate:[AuthGuard],
    loadChildren: () => import('./homepage/homepage.module')
      .then(m => m.HomePageModule),
   },
   {
    path: 'profile',
    canActivate:[AuthGuard],
    loadChildren: () => import('./profile/profile.module')
      .then(m => m.ProfileModule),
   },
   {
    path: 'public',
    loadChildren: () => import('./public/public.module')
      .then(m => m.PublicModule),
   },
   {
    path: 'p',
    canActivate:[AuthGuard],
    loadChildren: () => import('./experiment/experiment.module')
      .then(m => m.ExperimentModule),
   },
    {
    path: 'auth',
    loadChildren: () => import('./@auth/auth.module')
      .then(m => m.AuthModule),
    },
  { path: '',   redirectTo: 'pages', pathMatch: 'full' },
 { path: '**',    redirectTo: 'pages' },
];

const config: ExtraOptions = {
  useHash: false,
};


@NgModule({
  imports: [RouterModule.forRoot(routes,config)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
