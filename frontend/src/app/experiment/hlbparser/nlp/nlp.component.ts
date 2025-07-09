import { Component } from "@angular/core";
import * as Quill from "quill";
import EditorService from "../common/editor-service";
import { StateService } from "../../../state-service.service";
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpService } from 'src/app/http-service.service';

Quill.register("modules/counter", EditorService);
@Component({
  selector: "nlp",
  templateUrl: "./nlp.component.html",
  styleUrls: ["./nlp.component.scss"],
})
export class NlpComponent {
  service: any;
  nlpTextFilter: String = "";
  nlpText: String = "";
  behaviorText: String;
  behaviorList: any = [];
  localWordList: any;
  wordlist: any = [];

  constructor(
    private http: HttpService,
    private stateservice: StateService,
    private _snackBar: MatSnackBar
  ) {}

  created(editor) {
    this.nlpText = "";
    this.service = editor.getModule("counter");
  }
  logChange(event, id: number) {
    if (this.service.getText().trim() === "") {
      return;
    }
    var text = this.service.getText().split(/\s/);

    this.nlpTextFilter = text[text.length - 2];
  }
  insertValue(text: string) {
    this.service.insertValue(text);
  }

  delete(index: number) {
    this.behaviorList.splice(index, 1);
  }

  save() {
    var text = this.service.getText();
    var data = {
      text: text.trim(),
    };

    this.stateservice.enableLoader();
    this.http.put("v1/pr/nlp/behavior", data, {withCredential:true}).subscribe(
      (data) => {
        console.log(data);
        this.stateservice.disableLoader();

        this.stateservice.setBehavior(data.behavior);
        this.stateservice.setActors(data.actors);
        this.stateservice.setConstraints(data.constraints);
        this._snackBar.open("Successfully Translated.", "close", {
          duration: 2000,
        });
        // this.stateservice.setBindings(data.Bindings);
      },
      (error) => {
        this.stateservice.disableLoader();
        this._snackBar.open(error, "close", {
          duration: 2000,
        });
      }
    );
  }
  updateWordList() {
    this.localWordList = [];
    var dict = new Map();
    this.behaviorList.forEach((element) => {
      //console.log(element);
      var wordlist = element.text.trim().split(/\s/);
      wordlist.forEach((element) => {
        if (element.trim() !== "") {
          if (!dict.has(element.trim())) {
            this.localWordList.push({ value: element.trim() });
            dict.set(element.trim(), true);
          }
        }
      });
    });
    this.wordlist = this.wordlist.concat(this.localWordList);
  }
}
