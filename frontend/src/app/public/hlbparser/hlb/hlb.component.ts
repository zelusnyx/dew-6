import { Component, OnInit, Inject, ChangeDetectorRef } from "@angular/core";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import * as Quill from "quill";
import EditorService from "../common/editor-service";
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { HttpService } from "src/app/http-service.service";
import { StateService } from "src/app/state-service.service";

Quill.register("modules/counter", EditorService);

@Component({
  selector: "hlb",
  templateUrl: "./hlb.component.html",
  styleUrls: ["./hlb.component.scss"],
})
export class HlbComponent implements OnInit {
  actorService: EditorService;
  behaviorService: EditorService;
  editorService: EditorService;
  constraintService: EditorService;
  service: any;
  actorTextFilter: String = "";
  behaviorTextFilter: any = {
    name: "behavior",
    text: "",
  };
  constraintTextFilter: any = {
    name: "constraint",
    text: "",
  };
  editIndex: number;
  behaviorText: String;
  constraintText: string;
  textBoxId: number;
  behaviorList: any = [];
  constraintWordList: any = [];
  actorsList: any = [];
  contraintList: any = [];
  bindingList: any = [];
  suggestionbehaviorMessage: String;
  suggestionConstraintMessage: String;
  tokenLevel:String;
  bindingMap = new Map<String, any>();
  behaviorWordList: any = [];
  inputText: string = "";
  actors: String = "";
  selectedIndex: number = 0;
  constructor(
    private http: HttpService,
    public dialog: MatDialog,
    private stateservice: StateService,
    private _snackBar: MatSnackBar,
    private changeDetection: ChangeDetectorRef
  ) {}

  onlyReadable():boolean{return this.tokenLevel == 'read';}
  ngOnInit(): void {
    this.bindingMap = new Map<String, any>();
    this.behaviorList = [];
    const instance = this;
    this.tokenLevel = this.stateservice.getTokenLevel();
    this.stateservice.getBehavior().subscribe((data) => {
      if (data != null) {
        var text = "";
        data.forEach((element) => {
          text += element + "<br>";
        });
        instance.behaviorText = text;
      }
    });
    this.stateservice.getBindings().subscribe((data) => {
      if (data != null) {
        //console.log(data);
        this.bindingList = [];
        this.bindingMap = new Map<String, any>();

        data.forEach((element) => {
          var list = element.trim().split(" ");

          var key = list[0];

          var value = list.splice(1);

          value = value.join(" ");

          var t = { key: key, value: value };
          this.bindingMap.set(key, t);
          this.bindingList.push(t);
        });
        //console.log(this.bindingMap);
      }
    });
    this.stateservice.getActors().subscribe((data) => {
      // //console.log(data);
      if (data != null) {
        instance.actorsList = [];
        data.forEach((element) => {
          this.actorsList.push({ text: element });
        });
      }
    });
    this.stateservice.getConstraints().subscribe((data) => {
      // //console.log(data);
      if (data != null) {
        var text = "";
        data.forEach((element) => {
          text += element + "<br>";
        });
        instance.constraintText = text;
      }
    });
  }
  drop(event: CdkDragDrop<string[]>, list: Array<any>) {
    moveItemInArray(list, event.previousIndex, event.currentIndex);
  }
  created(editor, id: number) {
    // //console.log(id);
    var instance = this;
    switch (id) {
      case 1:
        this.actorService = editor.getModule("counter");
        break;
      case 2:
        this.behaviorService = editor.getModule("counter");

        this.behaviorService.isBlur().subscribe((data) => {
          if (data && instance.behaviorService.isTextChanged())
            this.updateActors();

          if (!data) this.textBoxId = 2;
          else this.textBoxId = -1;
        });
        this.behaviorService.isEnterPressed().subscribe((flag) => {
          if (flag && instance.behaviorService.isTextChanged()) {
            if (this.behaviorService.getText().trim() === "") return;
            var index = this.behaviorService.getText().length - 2;
            if (this.behaviorService.getText().charAt(index) == "\n")
              this.updateActors();
          }
        });

        this.behaviorService.isTabPressed().subscribe((flag) => {
          if (flag) {
            //console.log("inside istab");
            if (this.stateservice.getCurrentBehaviorWord().trim() != "")
              this.insertValue(
                this.stateservice.getCurrentBehaviorWord(),
                true
              );
            //this.behaviorService
          }
        });
        this.behaviorService.getSuggestionData().subscribe((data) => {
          if (data != null) {
            var params = {
              type: "behavior",
              suggestion_for: data.currentSentence,
              behaviors: data.remainingSentences,
              constraints: [],
              actors: [],
            };

            var constraints = this.constraintService.getText().trim();
            if (constraints != "") {
              var constraintsList = constraints.split("\n");
              params.constraints = constraintsList;
            }
            this.behaviorTextFilter.text = "";
            this.http.put("v1/pr/hlb/suggestions", params,{withCredential:true}).subscribe((data) => {
              var list = [];
              data.suggestions.forEach((element) => {
                list.push({ value: element, flag: false });
              });
              if (data.suggestion_text.trim() != "")
                this.suggestionbehaviorMessage = data.suggestion_text;
              else this.suggestionbehaviorMessage = null;
              this.behaviorWordList = list;
              this.changeDetection.detectChanges();
            });
          }
        });

        this.behaviorService.getCurrentWord().subscribe((data) => {
          //console.log(data);
          if (data != null && data.trim()) {
            this.behaviorTextFilter.text = data;
          }
        });
        break;
      case 3:
        this.constraintService = editor.getModule("counter");
        this.constraintService.isBlur().subscribe((data) => {
          if (data && instance.constraintService.isTextChanged())
            this.updateActorsConstraint();

          if (!data) this.textBoxId = 3;
          else this.textBoxId = -1;
        });
        this.constraintService.isEnterPressed().subscribe((flag) => {
          if (flag && instance.constraintService.isTextChanged()) {
            if (this.constraintService.getText().trim() === "") return;
            var index = this.constraintService.getText().length - 2;
            if (this.constraintService.getText().charAt(index) == "\n")
              this.updateActorsConstraint();
          }
        });

        this.constraintService.isTabPressed().subscribe((flag) => {
          if (flag) {
            if (this.stateservice.getCurrentConstraintWord().trim() != "")
              this.insertValueInConstraint(
                this.stateservice.getCurrentConstraintWord(),
                true
              );
            //this.behaviorService
          }
        });
        this.constraintService.getSuggestionData().subscribe((data) => {
          console.log("Blah!!")
          if (data != null) {
            var params = {
              type: "constraint",
              suggestion_for: data.currentSentence,
              behaviors: [],
              constraints: data.remainingSentences,
              actors: [],
            };
            var behaviors = this.behaviorService.getText().trim();
            if (behaviors != "") {
              var behaviorsList = behaviors.split("\n");
              params.behaviors = behaviorsList;
            }
            this.constraintTextFilter.text = "";
            this.http.put("v1/pr/hlb/suggestions", params, {withCredential:true}).subscribe((data) => {
              var list = [];
              data.suggestions.forEach((element) => {
                list.push({ value: element, flag: false });
              });
              if (data.suggestion_text.trim() != "")
                this.suggestionConstraintMessage = data.suggestion_text;
              else this.suggestionConstraintMessage = null;
              this.constraintWordList = list;
              this.changeDetection.detectChanges();
            });
          }
        });

        this.constraintService.getCurrentWord().subscribe((data) => {
          ////console.log(data);
          if (data != null && data.trim()) {
            this.constraintTextFilter.text = data;
          }
        });
        break;
    }
  }
  updateActors() {
    //console.log('inside update Actors');
    if (this.behaviorService.getText().trim() === "") {
      this.actorsList = [];
      return;
    }

    var data = {
      ParseType: "bash",
      Scenario: [],
      Constraints: [],
    };
    this.behaviorList = [];
    var blist = this.behaviorService.getText().trim().split("\n");
    blist.forEach((element) => {
      var text = element.trim();
      if (text != "") {
        data.Scenario.push(text);
        this.behaviorList.push(text);
      }
    });
    this.stateservice.setBehavior(this.behaviorList);

    this.http.put("v1/pr/hlb/parse", data, {withCredential:true}).subscribe((data: ParseApiBean) => {
      this.extractInfo(data);
    });
  }

  updateActorsConstraint() {
    if (this.constraintService.getText().trim() === "") {
      this.actorsList = [];
      return;
    }

    var data = {
      ParseType: "bash",
      Scenario: [],
      Constraints: [],
    };
    this.contraintList = [];
    var blist = this.constraintService.getText().trim().split("\n");
    blist.forEach((element) => {
      var text = element.trim();
      if (text != "") {
        data.Constraints.push(text);
        this.contraintList.push(text);
      }
    });

    this.stateservice.setConstraints(this.contraintList);
    this.http.put("v1/pr/hlb/parse", data, {withCredential:true}).subscribe((data: ParseApiBean) => {
      //console.log(data);
      //   this.extractInfo(data);
    });
  }
  extractInfo(data: ParseApiBean) {
    this.extractScenario(data.parsedScenario);
  }

  onBlurMethod(){
    
  }

  extractScenario(scenario) {
    //console.log(scenario);
    // this.bindingMap = new Map<String,any>();
    this.actorsList = [];
    this.bindingList = [];
    var trigger = [];
    scenario.forEach((element) => {
      this.extractActors(element[1] != null ? element[1] : []);

      if (element[0] != null) {
        element[0].map((x) => {
          if (!trigger.includes(x)) {
            trigger.push(x);
          }
        });
      }

      if (element[2] != null)
        element[2].map((x) => {
          if (!trigger.includes(x)) {
            trigger.push(x);
          }
        });
      if (element[3] != null)
        element[3].map((x) => {
          if (!trigger.includes(x)) {
            trigger.push(x);
          }
        });
    });

    this.extractEvents(trigger);

    // this.loadBindings();
    this.changeDetection.detectChanges();
  }

  isEmpty(binding): boolean {
    if (binding.value == undefined) return true;
    return binding.value.trim() == "";
  }
  loadBindings() {
    this.bindingMap.forEach((value, key) => {
      this.bindingList.push(key);
    });
  }
  extractEvents(
    triggers //,actions,emitters
  ) {
    //console.log(this.bindingMap);
    if (triggers != null)
      triggers.forEach((element) => {
        //console.log(element);
        if (!this.bindingMap.has(element)) {
          var t = { key: element, value: "" };
          this.bindingMap.set(element, t);
          this.bindingList.push(t);
        } else {
          this.bindingList.push(this.bindingMap.get(element));
        }
      });
    //   if(actions!=null)
    //   actions.forEach(element => {
    //     //console.log(element);

    //     if (!this.bindingMap.has(element)){
    //       var t = {key:element,value:""};
    //       this.bindingMap.set(element,t);
    //       this.bindingList.push(t);
    // }else{
    //   this.bindingList.push(this.bindingMap.get(element));

    // }
    //   });
    //   if(emitters!=null)
    //   emitters.forEach(element => {
    //     //console.log(element);

    //     if (!this.bindingMap.has(element)){
    //       var t = {key:element,value:""};
    //       this.bindingMap.set(element,t);
    //       this.bindingList.push(t);
    // }else{
    //   this.bindingList.push(this.bindingMap.get(element));

    // }
    //   });

    // //console.log(this.bindingMap);
  }
  logChangeBehavior(event) {
    if (this.behaviorService.getText().trim() === "") return;

    // var index = this.behaviorService.getText().length-2;
    // if (this.behaviorService.getText().charAt(index) == '\n')
    //     this.updateActors();
  }
  logChangeConstraints(event) {
    if (this.constraintService.getText().trim() === "") return;
    // //console.log(this.constraintService.getText().charAt(this.constraintService.getText().length-1))
  }
  insertValue(text: any, flag: boolean = false) {
    //console.log("word:"+text);
    this.service.insertValue(text, flag, this.behaviorTextFilter.text);
  }
  insertValueInConstraint(text: any, flag: boolean = false) {
    this.service.insertValue(text, flag, this.constraintTextFilter.text);
  }

  selectTextBox(id: number) {
    this.textBoxId = id;
    switch (id) {
      case 1:
        this.service = this.actorService;
        break;
      case 2:
        this.service = this.behaviorService;
        break;
      case 3:
        this.service = this.constraintService;
        break;
    }
  }

  isEnable(id: number): Boolean {
    return this.textBoxId == id;
  }

  extractActors(data: Array<any>) {
    data.forEach((element) => {
      ////console.log(element);
      this.insertActor(element);
    });
    var alist = [];
    this.actorsList.forEach((element) => {
      alist.push(element.text);
    });
    this.stateservice.setActors(alist);
  }

  insertActor(actor: String) {
    var t = this.actorsList.find(function (element) {
      return element.text === actor;
    });

    // //console.log(t);
    if (t == undefined) this.actorsList.push({ text: actor });
  }
  clear() {
    //console.log(this.behaviorText);
    this.service.clear();
    this.behaviorText = "";
  }

  selectedTab(index: number) {
    this.selectedIndex = index;
  }

  addBindings() {
    //console.log(this.bindingList);

    var dialogRef = this.dialog.open(BindingPopUp, {
      width: "70%",
      data: this.bindingList,
    });

    dialogRef.afterClosed().subscribe((result) => {
      //console.log('The dialog was closed');
      this.generateNs();
    });
  }
  generateNs() {
    var data = {
      actors: [],
      behaviors: [],
      constraints: [],
      bindings: [],
    };

    if (this.actorsList.length == 0) return;

    if (this.behaviorList.length == 0) return;
    this.actorsList.forEach((element) => {
      data.actors.push(element.text);
    });
    var flag = false;
    this.behaviorList.forEach((element) => {
      data.behaviors.push(element);
    });
    this.contraintList.forEach((element) => {
      data.constraints.push(element.text);
    });
    this.bindingList.forEach((element) => {
      if (element.value == null || element.value.trim() == "") {
        flag = true;
        return;
      }
      data.bindings.push(element.key + " " + element.value);
    });

    if (flag) return;
    this.stateservice.enableLoader();
    this.http.put("v1/pr/hlb/generateNs", data, {withCredential:true}).subscribe(
      (data) => {
        //console.log(data);
        this.stateservice.disableLoader();
        this.downLoadFile(data.script);
        this._snackBar.open("Successfully Downloaded.", "close", {
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
  storeBinding() {
    // console.log(this.bindingList);
    var binding = [];
    this.bindingList.forEach((element) => {
      binding.push(element.key.trim() + " " + element.value.trim());
    });

    this.stateservice.setBindings(binding);
  }
  downLoadFile(data: any) {
    var blob = new Blob([data], { type: "text/plain" });
    //console.log(blob);
    // var url = (window.URL || window.webkitURL).createObjectURL(blob);
    var fileName = "experiment.txt";
    if ("msSaveOrOpenBlob" in navigator) {
      navigator.msSaveOrOpenBlob(blob, fileName);
    } else {
      var downloadLink = document.createElement("a");
      downloadLink.download = fileName;
      downloadLink.innerHTML = "Download File";
      // if ('webkitURL' in window) {
      // Chrome allows the link to be clicked
      // without actually adding it to the DOM.
      //  downloadLink.href = window.webkitURL.createObjectURL(blob);
      // } else {
      // Firefox requires the link to be added to the DOM
      // before it can be clicked.
      downloadLink.href = window.URL.createObjectURL(blob);
      //downloadLink.onclick = destroyClickedElement;
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
      //  }

      downloadLink.click();
    }
  }
}

@Component({
  selector: "hlb-binding",
  templateUrl: "hlb-binding.component.html",
  styleUrls: ["./hlb.component.scss"],
})
export class BindingPopUp {
  constructor(
    public dialogRef: MatDialogRef<BindingPopUp>,
    @Inject(MAT_DIALOG_DATA) public bindingList: any
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
