import { Component, OnDestroy } from "@angular/core";

@Component({
  selector: "app-public",
  styleUrls: ['public.component.scss'],
  template: `
 <layout>
  <router-outlet></router-outlet>
  </layout>
 
  `
})
export class PublicComponent  {
  alive: boolean = true;

}
