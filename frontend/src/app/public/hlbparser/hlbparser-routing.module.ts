
import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { HLBParserComponent } from './hlpparser.component';
import { AuthGuard } from 'src/app/@auth/auth.guard';

const routes: Routes = [
  {
    path: "view/:id",
    canActivateChild: [AuthGuard],
    component: HLBParserComponent
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HLBParserRoutingModule {}
