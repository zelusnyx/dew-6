
import { NgModule } from "@angular/core";
import { MatTabsModule } from "@angular/material/tabs";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatInputModule } from "@angular/material/input";
import { MatCardModule } from "@angular/material/card";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {MatRadioModule} from '@angular/material/radio';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { StateService } from '../../state-service.service';
import { ExperimentComponent } from './experiments/experiment.component';

@NgModule({
  exports:[DashboardComponent],
  declarations: [
    DashboardComponent,
    ExperimentComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatToolbarModule,
    ReactiveFormsModule,
    MatRadioModule,
    MatDialogModule,
    MatButtonModule,
    MatSnackBarModule,
    FontAwesomeModule,
    MatTabsModule,
    MatTooltipModule,
    DragDropModule,
    FormsModule,
    MatTableModule,
    MatSelectModule,
    MatExpansionModule,
    MatCardModule,
    DashboardRoutingModule,
    MatInputModule,
    MatIconModule
  ],  providers: [StateService],
  bootstrap:[DashboardComponent]
})
export class DashboardModule {}
