import { Component, OnDestroy, OnInit } from "@angular/core";
import { StateService } from '../state-service.service';

@Component({
  selector: "app-profile-page",
  styleUrls: ['profile.component.scss'],
  template: `
  <fixed-layout>
  <router-outlet></router-outlet>
  
  </fixed-layout>
  <div *ngIf="loaderSwitch" class="loading style-2"><div class="loading-wheel"></div></div>
  `
})
export class ProfileComponent implements OnInit {
  alive: boolean = true;
 
    loaderSwitch: boolean = false;
    constructor(private state: StateService) {}
    ngOnInit(): void {
      this.state.isLoaderEnabled().subscribe(loader => {
        this.loaderSwitch = loader;
      });
    }
}
