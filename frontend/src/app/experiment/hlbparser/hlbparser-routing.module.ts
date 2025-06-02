
import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { HLBParserComponent } from './hlpparser.component';
import { AuthGuard } from 'src/app/@auth/auth.guard';
import { HlbComponent } from './hlb/hlb.component';
import { DependencyGraphComponent } from './dependency-graph/dependency-graph.component';

const routes: Routes = [
  {
    path: "c/:id",
    component: HLBParserComponent
  }
  ,{
    path: 'c',
    redirectTo: 'c/',
    pathMatch: 'full',
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HLBParserRoutingModule {}
