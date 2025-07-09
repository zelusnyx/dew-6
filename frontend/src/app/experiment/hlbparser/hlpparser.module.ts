import { NgModule, ModuleWithProviders } from "@angular/core";
import { MatTabsModule } from "@angular/material/tabs";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatInputModule } from "@angular/material/input";
import { MatCardModule } from "@angular/material/card";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { QuillModule } from "ngx-quill";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { StateService } from "../../state-service.service";
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NgxFileDropModule } from "ngx-file-drop";
import { HLBParserComponent } from "./hlpparser.component";
import { NgxGraphModule } from "@swimlane/ngx-graph";
import { CommonModule } from "@angular/common";
import { HLBParserRoutingModule } from "./hlbparser-routing.module";
import { RouterModule } from "@angular/router";
import { HlbComponent, BindingPopUp, HLBInforPopUp } from "./hlb/hlb.component";
import { NlpComponent } from "./nlp/nlp.component";
import { TextFilterPipe } from "./common/text-filter.pipe";
import {
  UploadComponent,
  FilePreviewComponent,
} from "./upload/upload.component";
import { AuthGuard } from "src/app/@auth/auth.guard";
import { AuthModule } from "src/app/@auth/auth.module";
import { DependencyGraphComponent } from "./dependency-graph/dependency-graph.component";
import { 
  TopologyGraphComponent,
  UpdateActorInfo
} from "./topology/topology.component";
import { ExperimentSlides } from "./experiment-slides/experiment-slides.component";
import { 
  SingleSlideComponent,
  UpdateSlideMapping
} from "./experiment-slides/single-slide.component";
import { DesignPageComponent } from "./design-page/design-page.component";
import { MatRadioModule } from "@angular/material/radio";
import {
  InfoComponent,
  AddUserPopUp,
  NLPPopUp,
  UploadPopUp,
  NSFilePopUp,
  BASHFilePopUp,
  UserListPopUp,
  VersionsPopUp,
} from "./experiment-info/info.component";
import {MatToolbarModule} from '@angular/material/toolbar';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { UserIdleModule } from 'angular-user-idle';
import {DeterLabViewComponent, RunVariablePopUp} from './deterlab-view/deterlab-view.component';
import { RunInfoComponent } from "./deterlab-view/run-info/run-info.component";
import { CurrentInfoComponent } from "./deterlab-view/current-info/current-info.component";

@NgModule({
  exports: [HLBParserComponent],
  declarations: [
    HLBParserComponent,
    HlbComponent,
    NlpComponent,
    DependencyGraphComponent,
    TopologyGraphComponent,
    DeterLabViewComponent,
    TextFilterPipe,
    UploadComponent,
    FilePreviewComponent,
    HLBInforPopUp,
    BindingPopUp,
    InfoComponent,
    AddUserPopUp,
    NLPPopUp,
    UploadPopUp,
    NSFilePopUp,
    BASHFilePopUp,
    UserListPopUp,
    VersionsPopUp,
    UpdateActorInfo,
    ExperimentSlides,
    SingleSlideComponent,
    UpdateSlideMapping,
    DesignPageComponent,
    RunVariablePopUp,
    RunInfoComponent,
    CurrentInfoComponent
  ],
  imports: [
    CommonModule,
    MatToolbarModule,
    AuthModule.forRoot(),
    ReactiveFormsModule,
    MatAutocompleteModule,
    RouterModule,
    MatTooltipModule,
    MatSelectModule,
    MatRadioModule,
    NgxGraphModule,
    MatDialogModule,
    MatButtonModule,
    MatSnackBarModule,
    FontAwesomeModule,
    MatTabsModule,
    MatSidenavModule,
    DragDropModule,
    FormsModule,
    MatTableModule,
    MatExpansionModule,
    MatCardModule,
    QuillModule.forRoot(),
    UserIdleModule.forRoot({}),
    HLBParserRoutingModule,
    MatInputModule,
    NgxFileDropModule,
    MatIconModule,
  ],
  entryComponents: [
    FilePreviewComponent,
    HLBInforPopUp,
    BindingPopUp,
    AddUserPopUp,
    NLPPopUp,
    UploadPopUp,
    NSFilePopUp,
    BASHFilePopUp,
    UserListPopUp,
    VersionsPopUp,
    UpdateActorInfo,
    ExperimentSlides,
    SingleSlideComponent,
    UpdateSlideMapping,
    DesignPageComponent,
    RunVariablePopUp
    ],
  providers: [StateService],
  bootstrap: [HLBParserComponent],
})
export class HLBParserModule {}
