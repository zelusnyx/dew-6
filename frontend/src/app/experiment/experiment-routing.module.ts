import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { ExperimentComponent } from './experiment.component';
import { PageNotFound } from './error/error.component';

const routes: Routes = [{
  path: '',
  component: ExperimentComponent,
  children: [
    {
      path: 'e',
      loadChildren: () => import('./hlbparser/hlpparser.module')
        .then(m => m.HLBParserModule),
    },
    {
      path: '',
      redirectTo: 'e',
      pathMatch: 'full',
    },
    {
      path: '**',
      component:PageNotFound,
    },
  ]
}];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ExperimentRoutingModule {}
