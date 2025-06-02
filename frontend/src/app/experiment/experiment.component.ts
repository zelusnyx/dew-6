import { Component, OnDestroy, OnInit } from "@angular/core";
import { StateService } from '../state-service.service';

@Component({
  selector: "app-experiment",
  styleUrls: ['experiment.component.scss'],
  template: `

  <router-outlet></router-outlet>
  

  <div *ngIf="loaderSwitch" class="loading style-2"><div class="loading-wheel"></div></div>
  `
})
export class ExperimentComponent implements OnInit {
  alive: boolean = true;
 
    loaderSwitch: boolean = false;
    constructor(private state: StateService) {}
    ngOnInit(): void {
      this.state.isLoaderEnabled().subscribe(loader => {
        this.loaderSwitch = loader;
      });
    }
}
