import { Component, OnInit } from "@angular/core";
import { StateService } from "../../state-service.service";
import { AuthService } from "src/app/@auth/auth.service";

@Component({
  selector: "accounts",
  templateUrl: "./accounts.component.html",
  styleUrls: ["./accounts.component.scss"],
})
export class AccountsComponent implements OnInit {
  userDetails: any;
  authService: AuthService;

  constructor(private state: StateService, authService: AuthService) {
    this.authService = authService;
  }

  ngOnInit(): void {
    this.userDetails = this.state.getUserDetails() == null ? {} : this.state.getUserDetails();
    this.authService.setRefreshTokenIntervals();
  }

}
