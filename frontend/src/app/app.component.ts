import { Component, OnInit } from "@angular/core";
import { StateService } from "./state-service.service";

@Component({
  selector: "app-root",
  styleUrls: ["./app.component.scss"],
  templateUrl: "./app.component.html"
})
export class AppComponent implements OnInit {
  loaderSwitch: boolean = false;
  constructor(private state: StateService) {}
  ngOnInit(): void {
    this.state.isLoaderEnabled().subscribe(loader => {
      this.loaderSwitch = loader;
    });
  }
  title = "DEWUI";
}
