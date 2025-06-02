
import { NgModule } from "@angular/core";
import { MatTabsModule } from "@angular/material/tabs";
import { FormsModule } from "@angular/forms";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatInputModule } from "@angular/material/input";
import { MatCardModule } from "@angular/material/card";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { QuillModule } from "ngx-quill";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule, MatSnackBarModule, MatDialogModule, MatTableModule } from '@angular/material';
import { NgxFileDropModule } from 'ngx-file-drop';
import { HLBParserComponent } from './hlpparser.component';
import {NgxGraphModule} from "@swimlane/ngx-graph"
import { CommonModule } from '@angular/common';
import { HLBParserRoutingModule } from './hlbparser-routing.module';
import { RouterModule } from '@angular/router';
import { HlbComponent, BindingPopUp } from './hlb/hlb.component';
import { NlpComponent } from './nlp/nlp.component';
import { TextFilterPipe } from './common/text-filter.pipe';
import { UploadComponent, FilePreviewComponent } from './upload/upload.component';
import { AuthModule } from 'src/app/@auth/auth.module';
import { DependencyGraphComponent } from './dependency-graph/dependency-graph.component';
import {MatRadioModule} from '@angular/material/radio';
import { InfoComponent } from './experiment-info/info.component';
import { HttpClientModule } from '@angular/common/http';
import { StateService } from 'src/app/state-service.service';

@NgModule({
  exports:[HLBParserComponent],
  declarations: [
    HLBParserComponent,
     HlbComponent,
     NlpComponent,
     DependencyGraphComponent,
     TextFilterPipe,
     UploadComponent,
     FilePreviewComponent,
     BindingPopUp,
     InfoComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatRadioModule,
    NgxGraphModule,
    MatDialogModule,
    MatButtonModule,
    MatSnackBarModule,
    FontAwesomeModule,
    MatTabsModule,
    DragDropModule,
    FormsModule,
    MatTableModule,
    MatExpansionModule,
    MatCardModule,
    QuillModule.forRoot(),
    HLBParserRoutingModule,
    MatInputModule,
    NgxFileDropModule
  ],
  entryComponents: [FilePreviewComponent,BindingPopUp],
  providers: [StateService],
  bootstrap:[HLBParserComponent]
})
export class PublicHLBParserModule {}
