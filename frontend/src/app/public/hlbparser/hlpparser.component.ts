import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { AuthService } from "src/app/@auth/auth.service";
import { StateService } from "src/app/state-service.service";
import { HttpService } from "src/app/http-service.service";

@Component({
  selector: "hlbparser",
  templateUrl: "./hlpparser.component.html",
  styleUrls: ["./hlpparser.component.scss"],
})
export class HLBParserComponent implements OnInit {
  menuList: any = [];
  experimentId: Number = -1;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    protected http: HttpService,
    private state: StateService,
    private auth: AuthService
  ) {}
  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params["id"] != "") {
        var input = {
          id: params["id"],
        };
        this.experimentId = params["id"];
        this.state.enableLoader();
        this.http
          .get("v1/pr/token-based-auth/get/" + this.experimentId, {withCredential:true})
          .subscribe((resultT) => {
            if (
              resultT.data != null &&
              resultT.data.token != undefined &&
              resultT.data.status
            ) {
              this.http
                .get("v1/pr/token-based-auth/getdetails/" + this.experimentId, {withCredential:true})
                .subscribe(
                  (result) => {
                    var data = result.data;
                    this.state.setActors(data.actors);
                    this.state.setExperimentName(data.name);
                    this.state.setExperimentDescription(data.description);
                    this.state.setBehavior(data.behaviors);
                    this.state.setBindings(data.bindings);
                    this.state.setConstraints(data.constraints);
                    this.state.setTokenLevel(resultT.data.level);
                    this.setMenu();
                    this.state.disableLoader();
                  },
                  (error) => {
                    alert("Invalid Token");
                    this.router.navigate(["auth/login"]);
                  }
                );
            } else {
              alert("Invalid Token");
              this.router.navigate(["auth/login"]);
            }
            return "";
          });
      }
    });
  }

  setMenu() {
    this.menuList.push({
      name: "Information",
      id: 1,
      html: "<experiment-info></experiment-info>",
    });
    this.menuList.push({
      name: "HLB",
      id: 2,
      html: "<hlb></hlb>",
    });
    if (this.state.getTokenLevel() == "write") {
      this.menuList.push({
        name: "NLP",
        id: 3,
        html: "<nlp></nlp>",
      });
      this.menuList.push({
        name: "Behavior Dependency Graph",
        id: 4,
        html: "<p>In Progress.....</p>",
      });
      this.menuList.push({
        name: "Upload",
        id: 5,
        html: "<upload></upload>",
      });
    }
  }
}
