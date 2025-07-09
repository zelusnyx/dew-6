import { Component, OnInit, Inject, Input, Output, ViewChild, HostListener, EventEmitter } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { HttpService } from "src/app/http-service.service";
import { StateService } from "src/app/state-service.service";


@Component({
  selector: "design-page",
  templateUrl: "design-page.component.html",
  styleUrls: ['./design-page.component.scss']
})
export class DesignPageComponent implements OnInit {
	@Output() navigate: EventEmitter<any> = new EventEmitter();

  constructor(
    protected http: HttpService,
    protected state: StateService,
    public dialog: MatDialog,
    private formBuilder: FormBuilder
  ) {
  }

  public ngOnInit(): void {
  }

  showTopology(){
    this.navigate.emit(5);
  }
}