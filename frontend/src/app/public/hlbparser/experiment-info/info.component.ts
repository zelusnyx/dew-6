import { Component, OnInit, Input } from "@angular/core";
import { AuthService } from "src/app/@auth/auth.service";
import { StateService } from "src/app/state-service.service";

@Component({
  selector: "experiment-info",
  templateUrl: "./info.component.html",
  styleUrls: ["./info.component.scss"],
})
export class InfoComponent implements OnInit {
  @Input() id: Number;
  experiment = {
    userId: this.auth.getCookie("userId"),
    name: "",
    description: "",
    behavior: [],
    actor: [],
    binding: [],
    constraint: [],
  };
  tokenList = [];
  tokenLevel:String;
  constructor(protected state: StateService, protected auth: AuthService) {}
  ngOnInit(): void {
    if (this.id != undefined && this.id != null && this.id != -1)
      this.experiment["id"] = this.id;
    this.state.getExperimentName().subscribe((name) => {
      this.experiment.name = name;
    });
    this.state.getExperimentDescription().subscribe((description) => {
      this.experiment.description = description;
    });
    this.state.getBehavior().subscribe((behaviorList) => {
      this.experiment.behavior = behaviorList;
    });
    this.state.getActors().subscribe((actorList) => {
      this.experiment.actor = actorList;
    });
    this.state.getBindings().subscribe((bindingList) => {
      this.experiment.binding = bindingList;
    });
    this.state.getConstraints().subscribe((constraintsList) => {
      this.experiment.constraint = constraintsList;
    });
    this.tokenLevel = this.state.getTokenLevel();
  }
  onlyReadable():boolean{return this.tokenLevel == 'read';}
  setExperimentName() {
    this.state.setExperimentName(this.experiment.name);
  }
  setExperimentDescription() {
    this.state.setExperimentDescription(this.experiment.description);
  }

  save() {
    console.log(this.experiment);
  }
}
