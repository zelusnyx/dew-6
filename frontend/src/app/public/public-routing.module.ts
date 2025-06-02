import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { PublicComponent } from './public.component';
import { PageNotFound } from './error/error.component';

const routes: Routes = [{
  path: '',
  component: PublicComponent,
  children: [
    {
      path: 'hlb',
      loadChildren: () => import('./hlbparser/hlpparser.module')
        .then(m => m.PublicHLBParserModule),
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
export class PublicRoutingModule {}
