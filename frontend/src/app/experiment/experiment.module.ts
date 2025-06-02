
import { NgModule} from "@angular/core";
import { ExperimentRoutingModule } from './experiment-routing.module';
import { ExperimentComponent } from './experiment.component';
import { HLBParserModule } from './hlbparser/hlpparser.module';
import { CommonModule } from '@angular/common';
import { QuillModule } from 'ngx-quill';
import { CoreModule } from '../@core/core.module';
import { PageNotFound } from './error/error.component';

@NgModule({
  exports:[ExperimentComponent],
  declarations: [
    ExperimentComponent,
    PageNotFound
  ],
  imports: [
    ExperimentRoutingModule,
    CommonModule,
    CoreModule,
    QuillModule.forRoot(),
    HLBParserModule,
  ]
})
export class ExperimentModule {}
