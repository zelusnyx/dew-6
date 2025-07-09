import {
  Component,
  OnInit,
  Inject,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostListener
} from "@angular/core";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import * as Quill from "quill";
import EditorService from "../common/editor-service";
import { StateService } from "../../../state-service.service";
import { MatSnackBar } from "@angular/material";
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { HttpService } from "src/app/http-service.service";
import { Observable, of } from "rxjs";
import * as _ from 'lodash';
// import * as $ from 'jquery';
import { DataSet } from 'vis-data';
import { Network } from 'vis-network';
import { GRAPH_ITEM_PARAMETERS_LIST } from '../../graph-data/graph-item-parameters-list';
import { GraphItemParameters, GraphItemType } from '../../graph-data/graph-item-parameters-interface';
import { NULL_EXPR } from "@angular/compiler/src/output/output_ast";
import { type } from "os";
import { LogService, LogHeader, LogEntry } from '../common/logging-service';
import { GoogleDriveService } from "src/app/google-drive-service.service";
declare let $: any;
import { AuthService } from '../../../@auth/auth.service';
import { waitForAsync as  } from "@angular/core/testing";

Quill.register("modules/counter", EditorService);

@Component({
  selector: "hlb",
  templateUrl: "./hlb.component.html",
  styleUrls: ["./hlb.component.scss"],
})
export class HlbComponent implements OnInit, AfterViewInit {

  @ViewChild('topologyGraphNetwork', { static: false }) topologyGraphNetwork!: ElementRef;
  @ViewChild('dependencyGraphNetwork', { static: false }) dependencyGraphNetwork!: ElementRef;
  @ViewChild('dependencyGraphCycleNetwork', { static: false }) dependencyGraphCycleNetwork!: ElementRef;
  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    this.addNodeType = null;
    this.clearMessage();
    this.topologyNetworkInstance.disableEditMode();
  }
  private topologyNetworkInstance: any;
  private dependencyNetworkInstance: any;
  private selectedNetworkInstance: any;
  private dependencyCycleNetworkInstance: any;
  authService: AuthService;
  addNodeType: "Node" | "LAN";
  isKeyPressed: boolean = false;
  graphItemParametersList: Map<any, GraphItemParameters>;
  actorService: EditorService;
  behaviorService: EditorService;
  filteredBindingHandle: Observable<string[]>;
  filteredBindingHandleForEvent: Observable<string[]>;
  topologyGraphNodes: DataSet<any>;
  topologyGraphEdges: DataSet<any>;
  topologyGraphSelectedNodeData: {
    id: any,
    name: string,
    nameEditable: boolean,
    nameEditableError: string,
    nodetype: string,
    actions: Array<{ id: any, action: string, topologyLabel: number }>
  };
  graph_data: any;
  graph_container: any;
  graphDescription: string;
  dependencyGraphNodes: DataSet<any>;
  dependencyGraphEdges: DataSet<any>;
  dependencyGraphCyclePath: null | Array<Array<String>>;
  actorsGroup: Map<string, number> = new Map();
  graphColors = ["#F0C929",
    "#F48B29",
    "#AC0D0D",
    "#693C72",
    "#55B3B1",
    "#F08A5D",
    "#B83B5E",
    "#54E346",
    "#1F1D36",
    "#420516",
    "#91091E",
    "#EE8572",
    "#35495E",
    "#347474",
    "#480032",
    "#FF4C29",
    "#FB3640",
    "#126E82",
    "#05004E",
    "#FF005C",
    "#240041",
    "#F4E557",
    "#B983FF",
    "#1DB9C3",
    "#005F99"];

  filterBindingOptions: any;
  filterBindingOptionsForEvent: any;
  filterBindingOptionsForEventCleaned: any;
  actionInBindingHelper: any;
  currentActionNameInModal = "";
  triggerSignals = [];
  specialFunctions: any;

  selectedDependencyNodeData: any;
  oldActor: any;
  oldAction: any;
  oldEmit: any;
  allDependencyNodeData: any;

  scenariosObjFormat = [];
  constraintsObjFormat = [];
  defaultTextColor = {};
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
  canvasClickFlag: Boolean = true;
  actionNumberNodes: Array<any>;
  actionNumberNodesDependency: Array<any>;
  canvasEventListenerTopology: any;
  canvasEventListenerDependency: any;

  bindingMap = new Map<String, any>();
  behaviorWordList: any = [];
  inputText: string = "";
  actors: String = "";
  selectedIndex = 0;
  experimentAccess = 4;
  showAlertMsg = false;
  alertMessage: string;
  showSpecialFuncDialog = false;
  constructor(
    private http: HttpService,
    public dialog: MatDialog,
    private stateservice: StateService,
    private _snackBar: MatSnackBar,
    private changeDetection: ChangeDetectorRef,
    private logger: LogService,
    authService: AuthService
  ) {
    this.authService = authService;
    this.graphItemParametersList = GRAPH_ITEM_PARAMETERS_LIST;
    accessibleLogger = logger;
    graphColors = this.graphColors;
  }

  resetFilterList() {
    this.logger.log(LogHeader.INFO, "Retreiving binding data from server");
    this.http
      .put('v1/pr/hlb/getBindingOptions', null, { withCredential: true })
      .subscribe((receivedData: ParseApiBean) => {
        this.filterBindingOptions = receivedData['event'];
        this.filterBindingOptionsForEvent = receivedData['trigger'];
        this.filterBindingOptionsForEventCleaned = this.filterBindingOptionsForEvent.map((value) => {
          return value.split(' - ')[0];
        });
        this.specialFunctions = receivedData['specialFunctions'];
        this.filteredBindingHandle = of(this.filterBindingOptions);
        this.filteredBindingHandleForEvent = of(this.filterBindingOptionsForEvent);
      });
  }
  searchFilter(value: any, category: any) {
    if (category === 'event' || category === 't_event') {
      this.filteredBindingHandleForEvent = of(
        this._filter(value, this.filterBindingOptionsForEvent)
      );
    } else {
      this.filteredBindingHandle = of(
        this._filter(value, this.filterBindingOptions)
      );
    }
  }

  convertStringToJsonObject(text: string) {
    const wordArray = text.trim().split(' ');
    const result = [];
    wordArray.forEach((element) => {
      if (this.defaultTextColor[element] !== undefined && this.defaultTextColor[element] !== null &&
        this.defaultTextColor[element].trim() !== '') {
        result.push({ insert: element + ' ', attributes: { color: this.defaultTextColor[element], bold: true } });
      } else {
        result.push({ insert: element + ' ' });
      }
    });
    return result;
  }

  convertTextToMap(textJson) {
    const map: Map<string, {}> = new Map<string, {}>();
    console.log(textJson)
    textJson.forEach(element => {
      map.set(element['text'] + "_row_" + element['row'], element)
    });

    return map;
  }

  openSideNavBar() {
    $('.side-nav-icon > img').toggleClass('hide');
    this.logger.log(LogHeader.KEY_PRESS, "User opened/closed the side navigation bar");
    setTimeout(() => {
      this.selectedNetworkInstance.fit();
    }, 600);
  }

  addColor(stringArray, row, map) {
    let occurenceMap: Map<String, number> = new Map<String, number>();
    stringArray.forEach(element => {
      if (occurenceMap.has(element.insert.trim())) {
        occurenceMap.set(element.insert.trim(), occurenceMap.get(element.insert.trim()) + 1)
      } else {
        occurenceMap.set(element.insert.trim(), 1)
      }

      if (map.has(element.insert.trim() + "_row_" + row)) {
        let detail = map.get(element.insert.trim() + "_row_" + row)
        if (detail['occurence'] == -1) {
          element["attributes"] = { "color": detail['color'], "bold": true }
        } else {
          if (occurenceMap.get(element.insert.trim()) == detail['occurence']) {
            element["attributes"] = { "color": detail['color'], "bold": true }
          }
        }

      }
    });

    return stringArray
  }

  colorText(data, textJson) {
    let map = this.convertTextToMap(textJson)
    var textArray = []
    let row = 1
    data.forEach((element) => {
      let stringArray = this.convertStringToJsonObject(element)
      textArray = [...textArray, ...this.addColor(stringArray, row, map), { insert: '\n' }]
      row++
    });

    return textArray
  }
  ngOnInit(): void {
    this.logger.log(LogHeader.INFO, "User entered the experiment page")
    this.authService.setRefreshTokenIntervals();
    this.resetFilterList();
    this.bindingMap = new Map<String, any>();
    this.behaviorList = [];
    const instance = this;
    this.stateservice.getBehavior().subscribe((data) => {
      if (data != null) {
        var text = "";
        var textArray = []
        data.forEach((element) => {
          textArray = [...textArray, ...this.convertStringToJsonObject(element), { insert: '\n' }]
          text += element + "<br>";
        });
        this.scenariosObjFormat = textArray
        instance.behaviorText = text;
      }
    });
    this.stateservice.getBindings().subscribe((data) => {
      if (data != null) {
        this.bindingList = [];
        this.filterBindingOptionsForEvent = [];
        this.bindingMap = new Map<String, any>();
        this.filterBindingOptionsForEvent = [];
        data.forEach((element) => {
          this.bindingMap.set(element.key, element);
          this.bindingList.push(element);
          if (element.category != 'event' && element.category != 't_event') {
            // Jelena
            this.filterBindingOptionsForEvent.push('pexists(' + element.key + ')');
            this.filterBindingOptionsForEvent.push('psuccess(' + element.key + ')');
          };
        });
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
        let text = '';
        let textArray = [];
        data.forEach((element) => {
          textArray = [...textArray, ...this.convertStringToJsonObject(element), { insert: '\n' }];
          text += element + '<br>';
        });
        instance.constraintText = text;
        this.constraintsObjFormat = textArray;
      }
    });
    this.stateservice.getExperimentControl().subscribe((flag) => {
      this.experimentAccess = flag;
    });

    //Detect Uploads
    this.stateservice.getUpload().subscribe((flag) => {
      if(flag) {
        this.stateservice.setUpload(false);
        setTimeout(()=>{
          this.detectDEWVersion();
          this.updateActors();
          this.updateActorsConstraint();
        }, 1000);
      }
    });

  }

  ngAfterViewInit(): void {
    //JQuery Functions
    $('.convert-btn > div').on('click', () => {
      var $convertButtonDiv = $('.convert-btn').parent();
      this.logger.log(LogHeader.KEY_PRESS, "User tried converting the constraints from DEW 1.0 to 2.0");
      //Animate Button
      $('.convert-btn > div').animate(
        { deg: '+=360' },
        {
          duration: 600,
          step: function (now) {
            $(this).css({ transform: 'rotate(' + now + 'deg)' });
          }
        }
      );
      //Update DEW
      const data = {
        constraints: []
      };
      const constraints = this.getConstraintsFromEditor();
      this.logger.log(LogHeader.DATA_SENT, constraints);
      data.constraints = constraints;
      this.http
        .put('v1/pr/convert/dew1to2', data, { withCredential: true })
        .subscribe((receivedData: ParseApiBean) => {
          $('.error-text').addClass('hide');
          this.stateservice.setConstraints(receivedData.parsedConstraints);
          this.logger.log(LogHeader.DATA_RECEIVED, receivedData.parsedConstraints);
          setTimeout(() => {
            this.updateActorsConstraint();
            $convertButtonDiv.addClass('hide');
          }, 1000);
        }, (error: any) => {
          $convertButtonDiv.find('.error-text').removeClass('hide');
          setTimeout(() => {
            $convertButtonDiv.find('.error-text').addClass('hide');
          }, 3000);
          this.logger.log(LogHeader.DATA_RECEIVED, "Error converting constraints");
        });
    });

    $('#modal-action-wait-checkbox').on('change', (event) => {
      $('#modal-action-wait-input').attr('disabled', !event.currentTarget.checked)
    });

    $('#modal-action-emit-checkbox').on('change', (event) => {
      $('#modal-action-emit-input').attr('disabled', !event.currentTarget.checked);
      if (!event.currentTarget.checked) {
        $('#modal-action-event-checkbox').prop('checked', false);
        $('#modal-event-binding-input').attr('disabled', true);
      }
      $('#modal-action-event-checkbox').attr('disabled', !event.currentTarget.checked);
    });

    $('#modal-action-trigger-checkbox').on('change', (event) => {
      $('#modal-action-trigger-selections').attr('disabled', !event.currentTarget.checked);
    });

    $('#modal-action-event-checkbox').on('change', (event) => {
      $('#modal-event-binding-input').attr('disabled', !event.currentTarget.checked)
    });

    $('#modal-action-name-input').on('change', (event) => {
      this.currentActionNameInModal = event.target.value;
      let binding = this.bindingList.find(item => item.key === this.currentActionNameInModal);
      binding && $('#modal-action-binding-input').val(binding.value);
    });

    this.toggleTopologyView();

  }

  detectDEWVersion(): void {
    const data = {
      constraints: []
    };
    var constraints = this.getConstraintsFromEditor();
    this.logger.log(LogHeader.INFO, 'Attempting to detect the DEW version');
    data.constraints = constraints;
    this.http
      .put('v1/pr/convert/detectDEWVersion', data, { withCredential: true })
      .subscribe((receivedData: ParseApiBean) => {
        var $convertDEWDiv = $('.convert-btn').parent();
        switch (receivedData['version']) {
          case 1:
            $convertDEWDiv.removeClass('hide');
            break;
          default:
            $convertDEWDiv.addClass('hide');
            break;
        }
      }, (error: any) => {
        this.logger.log(LogHeader.DATA_RECEIVED, "Error detecting DEW version");
      });
  }

  clearModalContent(): void {
    $('.modal-title').html('Add Action');
    $('.modal-delete-button').hide();
    $('.modal-add-button').html('Add');
    $('#modal-action-name-input').val('');
    $('#modal-action-binding-input').val('');
    $('#modal-action-wait-input').val('');
    $('#modal-action-emit-input').val('');
    $('#modal-event-binding-input').val('');
    $("#modal-action-trigger-selections option:selected").prop("selected", false);
    $(".modal-action-headers > input[type='checkbox']:checked").prop('checked', false).change();
    $("#modal-actor-input > option:selected").prop("selected", false);
    $("#modal-actor-input > option").filter(function () {
      return $(this).html() === swapJSON(id_of_node)[currentGraphItemSelection['id']];
    }).prop("selected", true);
    $("#modal-actor-input").attr('disabled', $('.graph-box-dependency').hasClass('hide'));
  }

  onEditActionFromTopologyDependencyClick(data) {
    var nodeData = (this.allDependencyNodeData.filter(item => parseInt(item.id) == parseInt(data)))[0]['data']
    this.populateAndShowEditActionModal(nodeData);
  }

  deleteActionFromUI(): void {
    const actor = $("#modal-actor-input > option:selected").html();
    const action = $('#modal-action-name-input').val().trim();
    this.onDependencyNodeDelete(actor, action);
    setTimeout(() => {
      this.updateActorsConstraint()
    }, 500);
    $('.modal').modal('toggle');
  }

  addActionFromUI(): void {
    var actionData = {};
    var action = $('#modal-action-name-input').val().trim();
    $('#modal-action-name-input').val(action);
    actionData['action'] = action;
    actionData['actor'] = $("#modal-actor-input > option:selected").html();
    if (actionData['action'] == '') {
      $('.modal-add-action-error').removeClass('hide');
      setTimeout(() => {
        $('.modal-add-action-error').addClass('hide');
      }, 3000);
    } else {
      $('.modal').modal('toggle');
      actionData['actionBinding'] = $('#modal-action-binding-input').val().trim();
      actionData['doesActionBindingExist'] = (actionData['actionBinding'] != '');
      actionData['emit'] = $('#modal-action-emit-input').val().trim();
      actionData['doesEmitExist'] = (actionData['emit'] != '') && $('#modal-action-emit-checkbox').prop('checked');
      actionData['wait'] = $('#modal-action-wait-input').val().trim();
      actionData['doesWaitExist'] = (actionData['wait'] != '') && $('#modal-action-wait-checkbox').prop('checked');
      actionData['eventBinding'] = $('#modal-event-binding-input').val().trim();
      actionData['doesEventBindingExist'] = (actionData['eventBinding'] != '') && $('#modal-action-event-checkbox').prop('checked');
      var triggers = []
      for (var item of $("#modal-action-trigger-selections option:selected")) {
        triggers.push(item.innerHTML);
      }
      actionData['triggers'] = triggers;
      actionData['doesTriggerExist'] = (actionData['triggers'].length > 0) && $('#modal-action-trigger-checkbox').prop('checked');
      if ($('.modal-title').html() == 'Edit Action') {
        if (this.oldEmit != actionData['emit'] && actionData['emit'] == "") {
          this.onDependencyNodeDelete(this.oldActor, this.oldAction);
        } else {
          var scenario = this.getScenariosFromEditor();
          var filtered = [];
          for (var i = 0; i < scenario.length; i++) {
            if (!(scenario[i].includes(this.oldActor + " ") && scenario[i].includes(" " + this.oldAction))) {
              if (this.oldEmit != "") {
                scenario[i] = scenario[i].replace(this.oldEmit, actionData['emit']);
              }
              filtered.push(scenario[i]);
            }
          }
          this.stateservice.setBehavior(filtered);
        }
        setTimeout(() => {
          this.updateScenarioFromAddActionUI(actionData);
        }, 500);
      } else {
        this.updateScenarioFromAddActionUI(actionData);
      }
    }
  }

  updateScenarioFromAddActionUI(actionData) {
    var newLine = this.buildScenarioLine(actionData);
    var scenario = this.getScenariosFromEditor();
    scenario.push(newLine);
    this.stateservice.setBehavior(scenario);
    this.logger.log(LogHeader.GRAPH_UPDATE, "User added a new scenario line from UI - " + newLine);
    setTimeout(() => {
      this.updateActorsConstraint()
    }, 1000);
  }

  buildScenarioLine(action: any): string {
    var result = "";
    var triggerStmt = "when "
    var waitStmt = "wait "
    var emitStmt = "emit "
    if (action['doesTriggerExist']) {
      result = result + triggerStmt;
      for (var item of action['triggers']) {
        result = result + item + ", "
      }
      result = result.substring(0, result.length - 2);
      result += " "
    }
    if (action['doesWaitExist']) {
      result += waitStmt + action['wait'] + " ";
    }
    result += action['actor'] + " " + action['action'] + " "
    if (action['doesEmitExist']) {
      result += emitStmt + action['emit'] + " "
    }
    result = result.substring(0, result.length - 1);
    var eventBinding = eventBinding = {
      'key': action['emit'],
      'category': 'event',
      'value': action['doesEventBindingExist'] ? action['eventBinding'] : ''
    };
    var actionBinding = {
      'key': action['action'],
      'category': 'action',
      'value': action['doesActionBindingExist'] ? action['actionBinding'] : ''
    };
    var temp = this.bindingList.filter((item) => { return item['category'] == 'action' && item['key'] == action['action'] });
    if (temp.length) {
      var index = this.bindingList.indexOf(temp[0]);
      this.bindingList.splice(index, 1);
    }
    temp = this.bindingList.filter((item) => { return item['category'] == 'event' && item['key'] == action['emit'] });
    if (temp.length) {
      var index = this.bindingList.indexOf(temp[0]);
      this.bindingList.splice(index, 1);
    }
    this.bindingList.push(actionBinding);
    action['doesEmitExist'] && this.bindingList.push(eventBinding);
    this.stateservice.setBindings(this.bindingList);
    return result;
  }


  isExperimentDisabled(): boolean {
    return this.experimentAccess == 2;
  }
  drop(event: CdkDragDrop<string[]>, list: Array<any>) {
    moveItemInArray(list, event.previousIndex, event.currentIndex);
  }
  private _filter(value: string, options): string[] {
    const filterValue = value.toLowerCase();
    return options.filter((option) =>
      option.toLowerCase().includes(filterValue)
    );
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
          // if (data && instance.behaviorService.isTextChanged())
          //   this.updateActors();

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
          if (data == null) {
            data = {
              currentSentence: "",
              remainingSentences: []
            }
          }
          if (data != null) {
            var params = {
              type: "behavior",
              suggestion_for: data.currentSentence,
              behaviors: data.remainingSentences,
              constraints: [],
              actors: [],
            };
            this.stateservice.getConstraints().subscribe((constraints) => {
              if (constraints != null || constraints != undefined) {
                params.constraints = constraints
              }
            })
            this.behaviorTextFilter.text = "";
            this.http
              .put("v1/pr/hlb/suggestions", params, { withCredential: true })
              .subscribe((data) => {
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
          // if (data && instance.constraintService.isTextChanged())
          //   this.updateActorsConstraint();

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
            if (this.stateservice.getCurrentConstraintWord().trim() != "") {
              this.insertValueInConstraint(
                this.stateservice.getCurrentConstraintWord(),
                true
              );
            }
          }
        });

        this.constraintService.getSuggestionData().subscribe((data) => {
          if (data == null) {
            data = {
              currentSentence: "",
              remainingSentences: []
            }
          }
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
            this.http
              .put("v1/pr/hlb/suggestions", params, { withCredential: true })
              .subscribe((data) => {
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
          if (data != null && data.trim()) {
            this.constraintTextFilter.text = data;
          }
        });
        break;
    }
    this.updateActors();
  }

  getScenariosFromEditor() {
    const bList = [];
    this.behaviorService.getText().trim().split('\n').forEach((element) => {
      const text = element.trim();
      if (text !== '') {
        bList.push(text);
      }
    });
    return bList;
  }

  getConstraintsFromEditor() {
    const cList = [];
    this.constraintService.getText().trim().split('\n').forEach((element) => {
      const text = element.trim();
      if (text !== '') {
        cList.push(text);
      }
    });
    return cList;
  }

  checkIfAllKeywordPresentInStrings(values) {
    for (const value of values) {
      if (value.includes('ALL') || value.includes('all')) {
        return true;
      }
    }
    return false;
  }

  updateActors() {
    // if (this.behaviorService.getText().trim() === '') {
    //   this.actorsList = [];
    //   return;
    // }

    setTimeout(()=>{

      if($("#scenario-quill-box .ql-editor")[0]!==document.activeElement) {
        const data = {
          ParseType: 'bash',
          Scenario: [],
          Constraints: [],
        };
        const scenarios = this.getScenariosFromEditor();
        // const constraints = this.getConstraintsFromEditor();
        // if (this.stateservice.getAllAnyPresentFlag() && (!this.checkIfAllKeywordPresentInStrings(scenarios) ||
        //     !this.checkIfAllKeywordPresentInStrings(constraints))) {
        //   // this.alertMessage = 'You have an unresolved choice between ALL or ANY for either a link or an event.' +
        //   //                     ' Please resolved it to process the bindings.';
        //   this.alertMessage = 'You have not inserted an ALL keyword for either a link command, lan command, ' +
        //                       'os command or an event. Please resolve it to process the bindings.';
        //   this.showAlertMsg = true;
        //   return;
        // } else {
        //   this.showAlertMsg = false;
        //   this.stateservice.setAllAnyPresentFlag(false);
        // }
        data.Constraints = this.getConstraintsFromEditor();
        data.Scenario = this.behaviorList = scenarios;
        this.stateservice.setBehavior(this.behaviorList);
        this.http
          .put('v1/pr/hlb/parse', data, { withCredential: true })
          .subscribe((receivedData: ParseApiBean) => {
            this.extractInfo(receivedData);
            //this.suggestAll(receivedData);
          });
      }

    }, 500);

  }

  updateActorsConstraint() {
    // if (this.constraintService.getText().trim() === '') {
    //   this.stateservice.setConstraints(this.getConstraintsFromEditor());
    //   this.actorsList = [];
    //   return;
    // }
    setTimeout(()=>{

      if($("#constraint-quill-box .ql-editor")[0]!==document.activeElement) {
        this.detectDEWVersion();
        const data = {
          ParseType: 'bash',
          Scenario: [],
          Constraints: [],
        };
        const scenarios = this.getScenariosFromEditor();
        const constraints = this.getConstraintsFromEditor();
        // if (this.stateservice.getAllAnyPresentFlag() && (!this.checkIfAllKeywordPresentInStrings(scenarios) ||
        //     !this.checkIfAllKeywordPresentInStrings(constraints))) {
        //   // this.alertMessage = 'You have an unresolved choice between ALL or ANY for either a link or an event.' +
        //   //                     ' Please resolved it to process the bindings.';
        //   this.alertMessage = 'You have not inserted an ALL keyword for either a link command, lan command, ' +
        //                       'os command or an event. Please resolve it to process the bindings.';
        //   this.showAlertMsg = true;
        //   return;
        // } else {
        //   this.showAlertMsg = false;
        //   this.stateservice.setAllAnyPresentFlag(false);
        // }
  
        data.Scenario = scenarios;
        data.Constraints = this.contraintList = constraints;
        this.stateservice.setConstraints(this.contraintList);
        this.http
          .put('v1/pr/hlb/parse', data, { withCredential: true })
          .subscribe((receivedData: ParseApiBean) => {
            //this.suggestAll(receivedData);
            this.extractInfo(receivedData);
          });
      }

    }, 500);
  }

  extractInfo(data: ParseApiBean) {
    this.actorsList = [];
    this.getActionBindingDataFromScenario(data['parsedScenario']);
    this.logger.log(LogHeader.TEXT_UPDATED, "Constraints/Scenario Updated");
    this.logger.log(LogHeader.DATA_RECEIVED, "Parsed Scenario - " + data.parsedScenario + " | Parsed Constraints - " + data.parsedConstraints);
    this.updateGraph();
    this.extractScenario(data.parsedScenario);
    this.storeBinding(undefined);
    this.detectDEWVersion();
  }

  getActionBindingDataFromScenario(data) {
    this.actionInBindingHelper = {};
    data.forEach(element => {
      this.actionInBindingHelper[element[3]] = element[2][0];
    });
    console.log(this.actionInBindingHelper);
  }

  assignNewActorInTopologyGraph(isLAN) {
    var name;
    var max_count = 0
    for (var i in id_of_node) {
      max_count = Math.max(max_count, id_of_node[i]);
    }
    for (var i in id_of_edge) {
      max_count = Math.max(max_count, id_of_edge[i]['id']);
    }
    name = isLAN ? "lan" + (max_count + 1) : "actor" + (max_count + 1);
    while (true) {
      let counter = max_count + 1;
      const duplicateNodes = this.topologyGraphNodes.get({
        filter: (node => node.label == name)
      });
      if (duplicateNodes.length) {
        counter++;
        name = "actor" + counter;
      } else {
        break;
      }
    }
    id_of_node[name] = max_count + 1;

    this.createNewGraphTypeObject(isLAN, name);
    return [isLAN ? "" : name, max_count + 1];
  }

  assignNewEdgeInTopologyGraph(from, to) {
    var max_count = 0
    for (var i in id_of_edge) {
      max_count = Math.max(max_count, id_of_edge[i]['id']);
    }
    for (var i in id_of_node) {
      max_count = Math.max(max_count, id_of_node[i]);
    }
    var swappedNodes = swapJSON(id_of_node);
    var name = swappedNodes[from] + '-' + swappedNodes[to];
    id_of_edge[name] = { from: from, to: to, id: max_count + 1 };
    console.log(id_of_edge)
    var temp = this.stateservice.getConstraints().source['_value'];
    temp.push('link ' + swappedNodes[from] + ' ' + swappedNodes[to] + " [ ]");
    // this.stateservice.setConstraints(temp);
    this.createNewGraphTypeObjectEdge(name);
    return max_count + 1;
  }

  createNewGraphTypeObjectEdge(name) {
    var temp = {};
    temp['bandwidth'] = '';
    temp['delay'] = '';
    temp['ipAddress'] = '';
    temp['operatingSystem'] = '';
    temp['hardwareType'] = '';
    temp['nodeName'] = name;
    temp['num'] = '';
    temp['type'] = GraphItemType.LINK;
    this.graphItemParametersList[id_of_edge[name]['id']] = temp;
    globalGraphItemParametersList = this.graphItemParametersList;
  }

  createNewGraphTypeObject(isLAN, name) {
    var temp = {}
    temp['bandwidth'] = '';
    temp['delay'] = '';
    temp['ipAddress'] = '';
    temp['operatingSystem'] = '';
    temp['hardwareType'] = '';
    temp['nodeName'] = name;
    temp['num'] = isLAN ? '' : '1';
    temp['type'] = isLAN ? GraphItemType.LAN : GraphItemType.NODE;
    this.graphItemParametersList[id_of_node[name]] = temp;
    globalGraphItemParametersList = this.graphItemParametersList;
  }

  updateGraph(updateTopology: boolean = true, updateDependency: boolean = true) { //Update the Graph View
    this.logger.log(LogHeader.GRAPH_UPDATE, "Graph update initiated");
    var request = {
      ParseType: 'bash',
      scenario: [],
      constraints: [],
    };
    var scenarios = this.getScenariosFromEditor();
    var constraints = this.getConstraintsFromEditor();
    request.constraints = constraints;
    request.scenario = scenarios;
    if (updateTopology) {
      this.http
        .put('v1/pr/hlb/topology/parse', request, { withCredential: true })
        .subscribe((receivedData: ParseApiBean) => {
          for (var item of Object.keys(receivedData['actors'])) {
            this.extractActors([item]);
          }
          //Graph Operations
          var temp_nodes = [];
          var temp_edges = [];
          id_of_node = {};
          id_of_edge = {};
          var id_count = 1;
          var temp;
          //Populate the Nodes in the Graph
          var actors = receivedData['actors'];
          for (var data in actors) {
            //Create actor group
            if (!this.actorsGroup.has(data)) {
              this.actorsGroup.set(data, this.actorsGroup.size);
            }
            if (!id_of_node[data]) {
              id_of_node[data] = id_count;
              temp = {
                id: id_count++,
                label: data.toString(),
                group: "group" + this.actorsGroup.get(data)
              }
              temp_nodes.push(temp);
              temp = {}
              temp['bandwidth'] = '';
              temp['delay'] = '';
              temp['ipAddress'] = actors[data]['ip'] == 'default' ? '' : actors[data]['ip'];
              temp['operatingSystem'] = actors[data]['os'] == 'default' ? '' : actors[data]['os'];
              temp['hardwareType'] = actors[data]['nodetype'] == 'default' ? '' : actors[data]['nodetype'];
              temp['nodeName'] = data;
              temp['num'] = actors[data]['num'];
              temp['type'] = GraphItemType.NODE;
              this.graphItemParametersList[id_count - 1] = temp;
              globalGraphItemParametersList = this.graphItemParametersList;
            }
          }
          var received_lans = receivedData['lans'];
          for (var i = 0; i < received_lans.length; i++) {
            var name = received_lans[i]['type'] + received_lans[i]['lineNum']
            if (!id_of_node[name]) {
              id_of_node[name] = id_count;
              temp = {
                id: id_count++,
                label: "",
                group: "LAN"
              }
              temp_nodes.push(temp);
            }
          }


          //Populate the Edges in the Graph
          var received_edges = receivedData['edges'];
          for (var i = 0; i < received_edges.length; i++) {
            var source = received_edges[i]['source'];
            var target = received_edges[i]['target'];
            temp = {
              from: id_of_node[source],
              to: id_of_node[target],
              id: id_count++
            }
            temp_edges.push(temp);
            id_of_edge[source + '-' + target] = temp;
            temp = {};
            temp['bandwidth'] = received_edges[i]['bw'] == 'default' ? '' : received_edges[i]['bw'];
            temp['delay'] = received_edges[i]['delay'] == 'default' ? '' : received_edges[i]['delay'];
            temp['ipAddress'] = '';
            temp['operatingSystem'] = '';
            temp['hardwareType'] = '';
            temp['nodeName'] = '';
            temp['num'] = ''; //The value is empty to help with the backend parsing of graph to text
            temp['type'] = target.includes('lan') ? GraphItemType.LAN : GraphItemType.LINK;
            var pointer = temp['type'] == GraphItemType.LAN ? id_of_node[target] : id_count - 1;
            this.graphItemParametersList[pointer] = temp;
            globalGraphItemParametersList = this.graphItemParametersList;
          }
          //Log Data
          this.logger.log(LogHeader.GRAPH_UPDATE, entry.printGraphParameterData(globalGraphItemParametersList, id_of_node, id_of_edge));

          // Create an array with nodes
          this.topologyGraphNodes = new DataSet<any>(
            temp_nodes
          );

          // Create an array with edges
          this.topologyGraphEdges = new DataSet<any>(
            temp_edges
          );

          var nodes = this.topologyGraphNodes;
          var edges = this.topologyGraphEdges;

          this.graph_data = { nodes, edges };

          this.topologyNetworkInstance = new Network(this.topologyGraphNetwork.nativeElement, this.graph_data, {
            manipulation: {
              enabled: false,
              initiallyActive: false,
              addNode: (nodeData, callback) => {
                if (this.addNodeType == "LAN") {
                  nodeData.group = "LAN";
                } else {
                  nodeData.group = "group" + this.actorsGroup.get(nodeData.label)
                }

                [nodeData.label, nodeData.id] = this.assignNewActorInTopologyGraph(nodeData.group == "LAN");

                this.createGraphItemEntry(nodeData);

                this.extractActors([nodeData.label]);
                if (!this.actorsGroup.has(nodeData.label)) {
                  this.actorsGroup.set(nodeData.label, this.actorsGroup.size);
                }
                
                setTimeout(() => {
                  this.topologyNetworkInstance.selectNodes([nodeData.id]);
                  setTimeout(async () => {
                    await this.onTopologyClick({ nodes: [nodeData.id], items: [], edges: [] });
                    if (this.addNodeType == "LAN") {
                      this.topologyGraphSelectedNodeData.nameEditable = false;
                    } else {
                      this.topologyGraphSelectedNodeData.nameEditable = true;
                    }
                  }, 100);
                }, 100);
                this.clearMessage();
                this.onTopologyChange();
                callback(nodeData);
              },
              addEdge: (edgeData, callback) => {
                //Check for self connection
                if (edgeData.from == edgeData.to) {
                  return;
                }
                //Check if such an edge already exists or 2 LANs are connected
                const sameEdges = this.topologyGraphEdges.get({
                  filter: (edge) =>
                    (edge.from == edgeData.from && edge.to == edgeData.to) ||
                    (edge.from == edgeData.to && edge.to == edgeData.from) ||
                    (this.topologyGraphNodes.get(edgeData.from)["group"] == "LAN" && this.topologyGraphNodes.get(edgeData.to)["group"] == "LAN")
                });
                if (sameEdges.length) {
                  return;
                }

                this.clearMessage();
                edgeData.id = this.assignNewEdgeInTopologyGraph(edgeData.from, edgeData.to);
                this.onTopologyChange();
                callback(edgeData);
              },
              deleteNode: (data, callback) => {
                //Remove node from id_of_node and all linked edges from id_of_edge
                var tempActorsList = this.actorsList;
                this.actorsList.splice(tempActorsList.map(element => element.text).indexOf(globalGraphItemParametersList[data.nodes[0]]['nodeName']), 1);
                delete id_of_node[Object.keys(id_of_node).find(node_name => id_of_node[node_name] == data.nodes[0])]
                delete globalGraphItemParametersList[data.nodes[0] + ""]
                for (var deletedEdge of data.edges) {
                  delete id_of_edge[Object.keys(id_of_edge).find(edge_name => id_of_edge[edge_name].id == deletedEdge)]
                }
                this.onTopologyDelete(this.topologyGraphNodes.get(data.nodes[0])['label']);
                this.onTopologyChange();
                callback(data);
              },
              deleteEdge: (data, callback) => {
                //Remove deleted edge from id_of_edge
                delete id_of_edge[Object.keys(id_of_edge).find(edge_name => id_of_edge[edge_name].id == data.edges[0])]
                delete globalGraphItemParametersList[data.edges[0] + ""]
                const edge = this.topologyGraphEdges.get(data.edges[0]);
                this.onTopologyChange();
                callback(data);
              }
            },
            edges: {
              color: '#777777'
            },
            nodes: {
              image: "/assets/server.png",
              shape: "image",
            },
            groups: {
              LAN: {
                shape: 'circle',
                color: '#000000'
              },
              ...Object.assign({}, ...this.graphColors.map((color, index) => ({ ["group" + (index)]: { font: { color } } })))
            },
            physics: {
              enabled: false
            }
          });

          this.topologyNetworkInstance.on('click', (properties) => {
            this.onTopologyClick(properties);
          });

          //Show legends in topology graph
          this.topologyNetworkInstance.on("afterDrawing", (ctx) => {

            this.canvasEventListenerTopology && ctx.canvas.removeEventListener('click', this.canvasEventListenerTopology);

            this.actionNumberNodes = []

            let curScale = this.topologyNetworkInstance.getScale();

            this.topologyGraphNodes.forEach((node) => {
              if (node.group != "LAN") {
                var nodePosition = this.topologyNetworkInstance.getPosition(node.id);

                let x = nodePosition.x;
                let y = nodePosition.y;

                //Draw node numbers
                var nodeNum = globalGraphItemParametersList[id_of_node[node.label]]['num'];
                if(nodeNum>1) {
                  ctx.fillStyle = "#E05860";
                  ctx.strokeStyle = "#E05860";
                  ctx.beginPath();
                  ctx.arc(x - 20, y - 25, 10, 0, 2 * Math.PI);
                  ctx.closePath();
                  ctx.fill();
                  ctx.stroke();

                  ctx.font = "10px Arial";
                  ctx.fillStyle = "#FFFFFF";
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillText(nodeNum, x - 20,y - 25);
                }

                this.dependencyGraphNodes.get({
                  filter: (item) => item.data.actors[0] == node.label
                }).forEach((dependencyNode, dependencyIndex) => {
                  ctx.strokeStyle = "#294475";
                  ctx.lineWidth = 2;
                  ctx.fillStyle = "#A6D5F7";

                  ctx.beginPath();
                  ctx.fillRect(x + 10 + (30 * (dependencyIndex + 1)) - 10, y - 10, 20, 20);
                  ctx.closePath();

                  ctx.fill();
                  ctx.stroke();

                  ctx.font = "10px Arial";
                  ctx.fillStyle = "#000000";
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillText(dependencyNode.topologyLabel + "", x + 10 + (30 * (dependencyIndex + 1)), y);
                  var abs_pos = this.topologyNetworkInstance.canvasToDOM(
                    this.topologyNetworkInstance.getPositions([node.id])[node.id]
                  );
                  this.actionNumberNodes.push({
                    x: abs_pos.x + (10 + (30 * (dependencyIndex + 1)) - 10) * curScale,
                    y: abs_pos.y - 10 * curScale,
                    width: 20 * curScale,
                    height: 20 * curScale,
                    dependencyNode: dependencyNode
                  });
                });
              }
            });


            function isIntersect(point, box) {
              return point.x >= box.x && point.x <= box.x + (box.width) && point.y >= box.y && point.y <= box.y + (box.height);
            }

            function getCursorPosition(canvas, event) {
              const rect = canvas.getBoundingClientRect()
              const x = event.clientX - rect.left
              const y = event.clientY - rect.top
              return {
                x: x,
                y: y
              }
            }

            this.canvasEventListenerTopology = ctx.canvas.addEventListener('click', (e) => {
              if (this.canvasClickFlag) {
                const pos = getCursorPosition(ctx.canvas, e);
                this.actionNumberNodes.forEach(item => {
                  if (isIntersect(pos, item)) {
                    this.onEditActionFromTopologyDependencyClick(item.dependencyNode.topologyLabel);
                  }
                });
                this.canvasClickFlag = false;
                setTimeout(() => { this.canvasClickFlag = true }, 1000);
              }
            });
          });

          this.topologyNetworkInstance.on('oncontext', function (properties) {
            // properties.event.preventDefault();
            // if (!properties.nodes.length) {
            //   $('.toastBox').fadeIn(200);
            //   setTimeout(() => {
            //     $('.toastBox').fadeOut(500);
            //   }, 4000);
            // } else {
            //   $(".custom-menu").is(':visible') && $(".custom-menu").finish().toggle();;
            //   $(".custom-menu").finish().toggle(100);
            //   $(".custom-menu").css({
            //     top: properties.event.pageY - 100 + "px",
            //     left: properties.event.pageX + "px"
            //   });
            // }
          });

          $('.dependency-topology-toggle-icon-topology').hasClass('active') && (this.selectedNetworkInstance = this.topologyNetworkInstance);

        });
    }

    if (updateDependency) {
      this.http.put("v1/pr/hlb/dependency-graph/has-cycle", { scenarios: scenarios }, { withCredential: true })
        .subscribe((d) => {
          const cyclePath = d["cycle_path"];
          this.dependencyGraphCyclePath = cyclePath;
          this.http.put("v1/pr/hlb/dependency_graph/parse", request, { withCredential: true })
            .subscribe((d) => {
              let nodes = []
              let links = []
              let topologyLabel = 1;
              for (const n of d['nodes']) {
                if (!this.actorsGroup.has(n.actors[0])) {
                  this.actorsGroup.set(n.actors[0], this.actorsGroup.size);
                }
                var n2 = {
                  data: n,
                  id: n.id,
                  label: n.action,
                  topologyLabel: topologyLabel++,
                  group: "group" + this.actorsGroup.get(n.actors[0])
                }
                nodes.push(n2)
              }

              for (const e of d['edges']) {
                var e2 = e
                e2.from = e2.source;
                e2.to = e2.target;
                e2.arrows = {
                  to: {
                    enabled: true,
                    type: "arrow",
                  },
                }
                const waitTime = (nodes.find(item => item.id == e2.target))['data']['wait_time'];
                e2.label = e2.label + (waitTime != "None" ? " (" + waitTime + "s)" : "");
                links.push(e2)
              }

              const graphGroups = Object.assign({}, ...this.graphColors.map((color, index) => ({ ["group" + (index)]: { color } })));

              this.allDependencyNodeData = nodes;

              this.dependencyGraphNodes = new DataSet<any>(nodes);
              this.dependencyGraphEdges = new DataSet<any>(links);

              this.dependencyGraphNodes.on("*", () => {
                this.topologyNetworkInstance.fit();
              });

              this.topologyNetworkInstance.fit();

              this.dependencyNetworkInstance = new Network(this.dependencyGraphNetwork.nativeElement, { nodes: this.dependencyGraphNodes, edges: this.dependencyGraphEdges }, {
                manipulation: {
                  enabled: false,
                  initiallyActive: false,
                  addNode: (data, callback) => { return; },
                  deleteNode: (data, callback) => {
                    const actor = this.dependencyGraphNodes.get(data.nodes[0])["data"].actors[0];
                    const action = this.dependencyGraphNodes.get(data.nodes[0])["data"].action;
                    this.onDependencyNodeDelete(actor, action);
                    callback(data);
                  },
                  addEdge: async (edgeData, callback) => {

                    if (edgeData.from == edgeData.to) {
                      return;
                    }
                    //Check if such an edge already exists
                    const sameEdges = this.dependencyGraphEdges.get({
                      filter: (edge) =>
                        (edge.from == edgeData.from && edge.to == edgeData.to) ||
                        (edge.from == edgeData.to && edge.to == edgeData.from)
                    });
                    if (sameEdges.length) {
                      return;
                    }

                    edgeData.arrows = {
                      to: {
                        enabled: true,
                        type: "arrow",
                      },
                    };
                    const actorFrom = this.dependencyGraphNodes.get(edgeData.from)["data"].actors[0];
                    const actionFrom = this.dependencyGraphNodes.get(edgeData.from)["data"].action;

                    const actorTo = this.dependencyGraphNodes.get(edgeData.to)["data"].actors[0];
                    const actionTo = this.dependencyGraphNodes.get(edgeData.to)["data"].action;
                    const result:any = await this.onDependencyUpdateEdge("INSERT", actorFrom, actionFrom, actorTo, actionTo);
                    const eventName = result.eventName;
                    const cyclePath = result.cyclePath;
                    //Only add edge if event name received (if event name is null, the new edge creates a cycle)
                    if (!cyclePath) {
                      const waitTime = this.dependencyGraphNodes.get(edgeData.to)['data']['wait_time'];
                      edgeData.label = eventName + (waitTime != "None" ? " (" + waitTime + "s)" : "");
                      callback(edgeData);
                    } else {
                      alert("Cannot add this dependency, as it will create cyclic dependency");
                    }
                    this.clearMessage();
                  },
                  deleteEdge: (data, callback) => {
                    const edgeData = this.dependencyGraphEdges.get(data.edges[0]);

                    const actorFrom = this.dependencyGraphNodes.get(edgeData["from"])["data"].actors[0];
                    const actionFrom = this.dependencyGraphNodes.get(edgeData["from"])["data"].action;

                    const actorTo = this.dependencyGraphNodes.get(edgeData["to"])["data"].actors[0];
                    const actionTo = this.dependencyGraphNodes.get(edgeData["to"])["data"].action;
                    this.onDependencyUpdateEdge("REMOVE", actorFrom, actionFrom, actorTo, actionTo)
                    this.clearMessage();
                    callback(data);
                  }
                },
                layout: {
                  hierarchical: {
                    sortMethod: "directed",
                    shakeTowards: "leaves",
                    treeSpacing: 150,
                    levelSeparation: 100,
                    nodeSpacing: 200,
                    edgeMinimization: false,
                    blockShifting: false
                  },
                },
                edges: {
                  color: '#999999',
                  length: 200
                },
                nodes: {
                  shape: "box",
                  font: {
                    color: '#FFFFFF'
                  }
                },
                groups: graphGroups,
                physics: {
                  enabled: false
                }
              });

              //Dependency Graph Click Event
              this.dependencyNetworkInstance.on('click', (properties) => {
                this.onDependencyClick(properties);
              });

              //Show legends in dependency graph
              this.dependencyNetworkInstance.on("afterDrawing", (ctx) => {

                this.actionNumberNodesDependency = []

                this.canvasEventListenerDependency && ctx.canvas.removeEventListener('click', this.canvasEventListenerDependency);

                let curScale = this.dependencyNetworkInstance.getScale();

                this.dependencyGraphNodes.forEach((node) => {
                  var nodePosition = this.dependencyNetworkInstance.getPosition(node.id);
                  var boundingBox = this.dependencyNetworkInstance.getBoundingBox(node.id);

                  let x = boundingBox.right;
                  let y = nodePosition.y;

                  ctx.strokeStyle = "#294475";
                  ctx.lineWidth = 2;
                  ctx.fillStyle = "#A6D5F7";

                  ctx.beginPath();
                  ctx.fillRect(x, y - 10, 20, 20);
                  ctx.closePath();

                  ctx.fill();
                  ctx.stroke();

                  ctx.font = "10px Arial";
                  ctx.fillStyle = "#000000";
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillText(node.topologyLabel + "", x + 10, y);

                  var abs_pos = this.dependencyNetworkInstance.canvasToDOM(
                    {
                      x: x,
                      y: y
                    }
                  );
                  this.actionNumberNodesDependency.push({
                    x: abs_pos.x + curScale,
                    y: abs_pos.y - 10 * curScale,
                    width: 20 * curScale,
                    height: 20 * curScale,
                    dependencyNode: node
                  });

                });


                function isIntersect(point, box) {
                  return point.x >= box.x && point.x <= box.x + (box.width) && point.y >= box.y && point.y <= box.y + (box.height);
                }
    
                function getCursorPosition(canvas, event) {
                  const rect = canvas.getBoundingClientRect()
                  const x = event.clientX - rect.left
                  const y = event.clientY - rect.top
                  return {
                    x: x,
                    y: y
                  }
                }
    
                this.canvasEventListenerDependency = ctx.canvas.addEventListener('click', (e) => {
                  if (this.canvasClickFlag) {
                    const pos = getCursorPosition(ctx.canvas, e);
                    this.actionNumberNodesDependency.forEach(item => {
                      console.warn(item)
                      console.error(pos)
                      if (isIntersect(pos, item)) {
                        this.onEditActionFromTopologyDependencyClick(item.dependencyNode.topologyLabel);
                      }
                    });
                    this.canvasClickFlag = false;
                    setTimeout(() => { this.canvasClickFlag = true }, 1000);
                  }
                });


              });

             


              //Show dependency cycle if any
              if (this.dependencyGraphCyclePath) {
                $('#dependencyGraphCycleContainer').show();
                const cycleNodes = this.dependencyGraphCyclePath.map((node, index) => {
                  return {
                    id: index,
                    label: node[1].toString(),
                    group: "group" + this.actorsGroup.get(node[0].toString())
                  }
                })

                const cycleEdge = [];
                for (let i = 0; i < this.dependencyGraphCyclePath.length; i++) {
                  cycleEdge.push({
                    from: i,
                    to: (i + 1) % this.dependencyGraphCyclePath.length,
                    arrows: {
                      to: {
                        enabled: true,
                        type: "arrow",
                      },
                    }
                  })
                }

                this.dependencyCycleNetworkInstance = new Network(this.dependencyGraphCycleNetwork.nativeElement, { nodes: cycleNodes, edges: cycleEdge }, {
                  edges: {
                    color: '#999999',
                    length: 200
                  },
                  nodes: {
                    // fixed: true,
                    shape: "box",
                    font: {
                      color: '#FFFFFF'
                    }
                  },
                  groups: graphGroups
                })

              } else {
                $('#dependencyGraphCycleContainer').hide();
              }
            })

          $('.dependency-topology-toggle-icon-dependency').hasClass('active') && (this.selectedNetworkInstance = this.dependencyNetworkInstance);
        });
    }

    $("#graph-container").keyup((e) => {
      this.isKeyPressed = false;
      if (e.key === " ") {
        this.addNodeType = null;
        this.clearMessage();
        this.selectedNetworkInstance.disableEditMode();
      } else if (e.key === "Delete") {
        this.selectedNetworkInstance.deleteSelected();
        var $dialogBox = $('.dialog-box');
        !$dialogBox.hasClass('hide') && $dialogBox.addClass('hide');
      }
    });

    $("#graph-container").keydown((e) => {
      if (this.isKeyPressed) {
        return;
      }
      this.isKeyPressed = true;
      if (e.key === " ") {
        this.selectedNetworkInstance.addEdgeMode();
        //this.displayMessage("Draw an edge between two nodes");
        accessibleLogger.log(LogHeader.GRAPH_UPDATE, "User initiated drawing an edge");
      }
    });
    this.logger.log(LogHeader.GRAPH_UPDATE, "Graph update completed");
  }

  createGraphItemEntry(nodeData) {
    var temp = {}
    temp['bandwidth'] = '';
    temp['delay'] = '';
    temp['ipAddress'] = '';
    temp['operatingSystem'] = '';
    temp['hardwareType'] = '';
    temp['nodeName'] = nodeData.label;
    temp['num'] = '1';
    temp['type'] = nodeData.group == "LAN" ? GraphItemType.LAN : GraphItemType.NODE;
    this.graphItemParametersList[nodeData.id] = temp;
    globalGraphItemParametersList = this.graphItemParametersList;
  }

  displayMessage = (message) => {
    $("#graphActionButtonList").hide();
    $("#actionMessage").html(message);
    $("#actionMessage").show();
  }

  clearMessage = () => {
    $("#graphActionButtonList").show();
    $("#actionMessage").html("<span>Hold <kbd>Space</kbd> and click-and-drag between nodes to add edges, Select a node/edge and press <kbd>Del</kbd> to delete</span>");
    //$("#actionMessage").hide();
  }

  onDependencyClick = async (properties) => {
    var ids = properties.nodes;
    var clickedNodes = this.dependencyGraphNodes.get(ids);
    (clickedNodes.length) ? $('.dialog-box-action-button, .modal-add-button, .dependency-edit-action-button').css('background-color', graphColors[clickedNodes[0]['group'].replace('group', '')]) && (this.selectedDependencyNodeData = clickedNodes[0]['data']) && $('.dependency-edit-action-button').removeClass('hide') : $('.dependency-edit-action-button').addClass('hide');
  }

  onTopologyClick = async (properties) => {
    var ids = properties.nodes;
    var clickedNodes = this.topologyGraphNodes.get(ids);
    var items = properties.items;
    //Show Dialog Box
    var $dialogBox = $('.dialog-box');
    $dialogBox.hasClass('hide') && $dialogBox.toggleClass('hide');
    clickedNodes.length || items.length || $dialogBox.toggleClass('hide');
    //Show Node/Link Content
    if (clickedNodes.length) {
      accessibleLogger.log(LogHeader.KEY_PRESS, "User Clicked on a Node");
      $('.dialog-box-action-button').removeClass('hide');
      var nodeGroup = clickedNodes[0]['group'];
      nodeGroup.includes('group') && $('.dialog-box-action-button, .modal-add-button').css('background-color', graphColors[nodeGroup.replace('group', '')]);
      $('#dialog-box-title').html(clickedNodes[0].label) && (currentGraphItemSelection['id'] = clickedNodes[0].id) && (currentGraphItemSelection['type'] = 'node');
      for (var i in id_of_node) {
        if (id_of_node[i] == currentGraphItemSelection['id'] && clickedNodes[0].group == 'LAN') {
          accessibleLogger.log(LogHeader.KEY_PRESS, "User Clicked on a LAN");
          $('#dialog-box-title').html('LAN') && (currentGraphItemSelection['type'] = 'lan');
          $('.dialog-box-action-button').addClass('hide');
          break;
        }
      }
    }
    if (items.length && (clickedNodes.length == 0)) {
      accessibleLogger.log(LogHeader.KEY_PRESS, "User Clicked on a Link");
      $('#dialog-box-title').html('Link') && (currentGraphItemSelection['id'] = items[0].edgeId) && (currentGraphItemSelection['type'] = 'link');
      $('.dialog-box-action-button').addClass('hide');
      var selectedEdge = items[0]['edgeId'];
      var id_of_nodes_rev = swapJSON(id_of_node);
      for (var i in id_of_edge) {
        if (id_of_edge[i]['id'] == selectedEdge && id_of_nodes_rev[id_of_edge[i]['to']].includes('lan')) {
          $dialogBox.toggleClass('hide');
          break;
        }
      }
    }
    if ((items.length && clickedNodes.length == 0) || currentGraphItemSelection['type'] == 'lan') {
      $('.dialog-box-fields:not(is-node)').removeClass('hide');
      $('.dialog-box-fields.is-node').addClass('hide');
    } else if (clickedNodes.length) {
      $('.dialog-box-fields:not(is-node)').addClass('hide');
      $('.dialog-box-fields.is-node').removeClass('hide');
    }
    if (ids[0]) {
      const selectedNode: any = this.topologyGraphNodes.get(ids[0]);
      const selectedNodeData = {
        id: selectedNode.id,
        name: String(selectedNode.label),
        nameEditable: false,
        nameEditableError: null,
        nodetype: selectedNode.group == 'LAN' ? 'LAN' : 'NODE',
        actions: Array<{ id: any, action: string, topologyLabel: number }>()
      }
      if (selectedNode.group != 'LAN') {
        selectedNodeData.actions = this.dependencyGraphNodes.get({
          filter: (item) => item.data.actors[0] == selectedNode.label
        }).map(item => {
          return {
            id: item.id,
            action: item.label,
            topologyLabel: item.topologyLabel
          }
        });
      }
      this.topologyGraphSelectedNodeData = selectedNodeData;
    } else {
      this.topologyGraphSelectedNodeData = null;
    }
    showRelevantContentInDialogBox(); //Content to Display on the Context Menu
    //Hide dialogBox and customMenu
    //$(".custom-menu").is(':visible') && $(".custom-menu").finish().toggle(100);
  }

  onTopologyNodeChange = () => {
    if (!this.topologyGraphSelectedNodeData.name) {
      this.topologyGraphSelectedNodeData.nameEditableError = "Required";
      return;
    }
    const duplicateNodes = this.topologyGraphNodes.get({
      filter: (node => node.id != this.topologyGraphSelectedNodeData.id && node.label == this.topologyGraphSelectedNodeData.name)
    });
    if (duplicateNodes.length) {
      this.topologyGraphSelectedNodeData.nameEditableError = "Duplicate node name";
    } else {
      this.topologyGraphSelectedNodeData.nameEditableError = null;
    }
  }

  onTopologyNodeSave = () => {
    if (!this.topologyGraphSelectedNodeData.nameEditableError) {
      const new_name = this.topologyGraphSelectedNodeData.name;
      const old_name = this.topologyGraphNodes.get(this.topologyGraphSelectedNodeData.id)['label'];
      const node_id = this.topologyGraphSelectedNodeData.id;
      this.actorsList[this.actorsList.findIndex(item => item['text'] == old_name)]['text'] = new_name;
      let index = Object.keys(this.graphItemParametersList).find(key => this.graphItemParametersList[key]['nodeName'] === old_name);
      this.graphItemParametersList[index]['nodeName'] = new_name;
      globalGraphItemParametersList = this.graphItemParametersList;

      let temp = swapJSON(id_of_node);
      temp[currentGraphItemSelection['id']] = new_name;
      id_of_node = swapJSON(temp);

      var request = {
        constraints: this.getConstraintsFromEditor(),
        scenarios: this.getScenariosFromEditor(),
        old_name: old_name,
        new_name: new_name
      };
      this.http
        .put('v1/pr/hlb/topology/node-rename', request, { withCredential: true })
        .subscribe((receivedData: ParseApiBean) => {

          this.actorsGroup.set(new_name, this.actorsGroup.get(old_name));
          this.actorsGroup.delete(old_name);

          this.stateservice.setBehavior(receivedData['scenarios']);
          this.stateservice.setConstraints(receivedData['constraints']);

          this.topologyGraphNodes.update({
            id: node_id,
            label: new_name
          });
          $('#dialog-box-title').html(new_name);
          this.topologyGraphSelectedNodeData.nameEditable = false;
          setTimeout(() => {
            this.updateGraph(false, true);
          }, 500)
        });
    }
  }

  onTopologyNodeCancel = () => {
    this.topologyGraphSelectedNodeData.nameEditable = false;
    this.topologyGraphSelectedNodeData.name = this.topologyGraphNodes.get(this.topologyGraphSelectedNodeData.id)['label'];
  }

  onAddNodeClick = (type) => {
    accessibleLogger.log(LogHeader.GRAPH_UPDATE, "User initiated node addition. Node type - " + type);
    if (type == "Node") {
      this.addNodeType = "Node";
      this.displayMessage("Click anywhere to add a node, press <kbd>ESC</kbd> to cancel.");
    } else {
      this.addNodeType = "LAN";
      this.displayMessage("Click anywhere to add a LAN, press <kbd>ESC</kbd> to cancel.");
    }
    this.topologyNetworkInstance.addNodeMode();
    $("#graph-container").focus();
  }

  onAddActionDependencyClick() {
    this.clearModalContent();
    $('.dialog-box-action-button, .modal-add-button').css('background-color', '#04aa6d');
    $('.modal').modal('toggle');
  }

  onEditActionDependencyClick() {
    this.populateAndShowEditActionModal(this.selectedDependencyNodeData);
  }

  populateAndShowEditActionModal(nodeData) {
    $('.modal').modal('toggle');
    $('.modal-title').html('Edit Action');
    $('.modal-delete-button').show();
    $('.modal-add-button').html('Edit');
    $("#modal-actor-input > option:selected").prop("selected", false);
    $("#modal-actor-input > option").filter(function () {
      return $(this).html() === nodeData['actors'][0];
    }).prop("selected", true);
    this.oldActor = $("#modal-actor-input > option:selected").html();
    $("#modal-actor-input").attr('disabled', true);
    $('#modal-action-name-input').val(nodeData['action']);
    this.oldAction = nodeData['action'];
    if (nodeData['wait_time'] != "None") {
      $('#modal-action-wait-checkbox').prop('checked', true).change();
      $('#modal-action-wait-input').val(nodeData['wait_time']);
    } else {
      $('#modal-action-wait-checkbox').prop('checked', false).change();
      $('#modal-action-wait-input').val("");
    }
    if (nodeData['e_events'].length) {
      this.oldEmit = nodeData['e_events'][0];
      $('#modal-action-emit-checkbox').prop('checked', true).change();
      $('#modal-action-emit-input').val(nodeData['e_events'][0]);
      var tempEventBinding = this.bindingList.filter((item) => { return item['category'] == 'event' && item['key'] == nodeData['e_events'][0] });
      tempEventBinding = tempEventBinding[0]['value'];
      if (tempEventBinding) {
        $('#modal-action-event-checkbox').prop('checked', true).change();
      } else {
        $('#modal-action-event-checkbox').prop('checked', false).change();
      }
      $('#modal-event-binding-input').val(tempEventBinding);
    } else {
      $('#modal-action-emit-checkbox').prop('checked', false).change();
      $('#modal-action-emit-input').val("");
      this.oldEmit = "";
    }
    $("#modal-action-trigger-selections option:selected").prop("selected", false);
    if (nodeData['t_events'].length) {
      $("#modal-action-trigger-selections option").filter(function () {
        return nodeData['t_events'].includes($(this).html());
      }).prop("selected", true);
      $('#modal-action-trigger-checkbox').prop('checked', true).change();
    } else {
      $('#modal-action-trigger-checkbox').prop('checked', false).change();
    }
    var tempBindings = this.bindingList.filter((item) => { return item['category'] == 'action' && item['key'] == nodeData['action'] });
    tempBindings = tempBindings[0]['value'];
    $('#modal-action-binding-input').val(tempBindings);
  }

  toggleTopologyView() {
    this.logger.log(LogHeader.KEY_PRESS, "User toggled topology view");
    $('.dependency-topology-toggle-icon-topology').addClass('active');
    $('.dependency-topology-toggle-icon-dependency').removeClass('active');
    $('.graph-box').removeClass('hide');
    $('.graph-box-dependency').addClass('hide');
    //$(".custom-menu").is(':visible') && $(".custom-menu").finish().toggle(100);
    var $dialogBox = $('.dialog-box');
    !$dialogBox.hasClass('hide') && $dialogBox.addClass('hide');
    $('#graphActionButtonList').removeClass('hide');
    this.graphDescription = "This graph depicts the connections between different Node/LAN in the network";
    this.selectedNetworkInstance = this.topologyNetworkInstance;
    this.selectedNetworkInstance.fit();
  }

  toggleDependencyView() {
    this.logger.log(LogHeader.KEY_PRESS, "User toggled dependency view");
    $('.dependency-topology-toggle-icon-topology').removeClass('active');
    $('.dependency-topology-toggle-icon-dependency').addClass('active');
    $('.graph-box').addClass('hide');
    $('.graph-box-dependency').removeClass('hide');
    //$(".custom-menu").is(':visible') && $(".custom-menu").finish().toggle(100);
    var $dialogBox = $('.dialog-box');
    !$dialogBox.hasClass('hide') && $dialogBox.addClass('hide');
    $('#graphActionButtonList').addClass('hide');
    this.graphDescription = "This graph depicts the dependency between different actions as stated in scenario";
    this.selectedNetworkInstance = this.dependencyNetworkInstance;
    this.selectedNetworkInstance.fit();
    this.dependencyCycleNetworkInstance.fit();
  }

  onTopologyChange() {
    this.logger.log(LogHeader.KEY_PRESS, "The topology changed");
    var request = {
      parameters: [JSON.stringify(globalGraphItemParametersList)],
      nodes: [JSON.stringify(id_of_node)],
      edges: [JSON.stringify(id_of_edge)]
    };
    this.http
      .put('v1/pr/hlb/topology-graph/generate-constraints', request, { withCredential: true })
      .subscribe((receivedData: ParseApiBean) => {
        this.stateservice.setConstraints(receivedData['constraints']);
        this.logger.log(LogHeader.DATA_RECEIVED, "Updated constraints - " + receivedData['constraints']);
      });
  }

  onTopologyDelete(deletedNode: string) {
    this.logger.log(LogHeader.KEY_PRESS, "User tried to delete a topology element");
    var request = {
      scenarios: this.getScenariosFromEditor(),
      bindings: [JSON.stringify(this.bindingList)],
      deleted_node: deletedNode,
    };
    this.logger.log(LogHeader.DATA_SENT, "Scenario - " + request['scenarios'] + ",Bindings - " + request['bindings'] + ", Deleted Node - " + request['deleted_node']);
    this.http
      .put('v1/pr/hlb/topology/graph-remove', request, { withCredential: true })
      .subscribe((receivedData: ParseApiBean) => {
        this.stateservice.setBehavior(receivedData['scenarios']);
        this.stateservice.setBindings(receivedData['bindings']);
        this.logger.log(LogHeader.DATA_RECEIVED, "Scenario - " + receivedData['scenarios'] + ", Bindings - " + receivedData['bindings']);
        setTimeout(() => {
          this.updateGraph(false, true);
        }, 500)
      });
  }

  onTopologyParametersChange(event: any) {
    // type: GraphItemType,
    // bandwidth: string,
    // delay: string,
    // ipAddress: string,
    // operatingSystem: string,
    // hardwareType: string
    // num: string
    this.logger.log(LogHeader.GRAPH_UPDATE, "Topology parameters have changed");
    var temp = this.graphItemParametersList[currentGraphItemSelection['id']] ? this.graphItemParametersList[currentGraphItemSelection['id']] : null;
    if (!temp) {
      temp = {};
      temp['bandwidth'] = '';
      temp['delay'] = '';
      temp['ipAddress'] = '';
      temp['operatingSystem'] = '';
      temp['hardwareType'] = '';
      temp['nodeName'] = '';
      temp['num'] = '1'; //Default Value - keep for number of nodes
      switch (currentGraphItemSelection['type']) {
        case 'node':
          temp['type'] = GraphItemType.NODE;
          temp['nodeName'] = $('#dialog-box-title').html();
          break;
        case 'link':
          temp['type'] = GraphItemType.LINK;
          break;
        case 'lan':
          temp['type'] = GraphItemType.LAN;
          break;
      }
    }
    var currentValue = event.target.value;
    var currentField = $(event.target).attr('id');
    switch (currentField) {
      case 'node-ip-address':
        temp['ipAddress'] = currentValue;
        break;
      case 'node-operating-system':
        temp['operatingSystem'] = currentValue;
        break;
      case 'node-hardware-type':
        temp['hardwareType'] = currentValue;
        break;
      case 'node-num':
        temp['num'] = currentValue == "" || (parseInt(currentValue) <= 0) ? '1' : currentValue;
        $('#node-num').val(temp['num']);
        break;
      case 'link-bandwidth':
        temp['bandwidth'] = currentValue == "" ? '' : (parseInt(currentValue) < 0 ? '' : currentValue);
        break;
      case 'link-delay':
        temp['delay'] = currentValue == "" ? '' : (parseInt(currentValue) < 0 ? '' : currentValue);
        break;
    }
    this.graphItemParametersList[currentGraphItemSelection['id']] = temp;
    globalGraphItemParametersList = this.graphItemParametersList;
    this.logger.log(LogHeader.GRAPH_UPDATE, entry.printGraphParameterData(globalGraphItemParametersList, id_of_node, id_of_edge));
    this.onTopologyChange();
  }

  onDependencyNodeDelete(actor, action) {
    this.logger.log(LogHeader.GRAPH_UPDATE, "User deleted actor - " + actor + ", action - " + action);
    var request = {
      scenarios: this.getScenariosFromEditor(),
      bindings: [JSON.stringify(this.bindingList)],
      actor: actor,
      action: action,
    };
    this.http
      .put('v1/pr/hlb/dependency-graph/node-delete', request, { withCredential: true })
      .subscribe((receivedData: ParseApiBean) => {
        this.stateservice.setBehavior(receivedData['scenarios']);
        this.stateservice.setBindings(receivedData['bindings']);
      });

  }

  onDependencyUpdateEdge(updateType, actorFrom, actionFrom, actorTo, actionTo) {
    this.logger.log(LogHeader.GRAPH_UPDATE, "User updated edge of dependency graph. actorFrom - " + actorFrom + ", actionFrom - " + actionFrom + ", actorTo - " + actorTo + ", actionTo - " + actionTo);
    return new Promise((resolve, reject) => {
      var request = {
        scenarios: this.getScenariosFromEditor(),
        bindings: [JSON.stringify(this.bindingList)],
        actor_from: actorFrom,
        action_from: actionFrom,
        actor_to: actorTo,
        action_to: actionTo,
        update_type: updateType
      };
      this.http
        .put('v1/pr/hlb/dependency-graph/update-edge', request, { withCredential: true })
        .subscribe((receivedData: ParseApiBean) => {
          this.stateservice.setBehavior(receivedData['scenarios']);
          this.stateservice.setBindings(receivedData['bindings']);
          resolve({ eventName: receivedData['event_name'], cyclePath: receivedData['cycle_path'] });
        });
    });

  }

  removeConstraintSentences(data) {
    var temp = [];
    data.forEach(element => {
      if (!['os', 'nodetype', 'ip'].includes(element.split(' ')[0])) {
        temp.push(element);
      }
    });
    return temp;
  }

  checkIfEmittedEventIsATriggerEvent(emittedEvents, scenario) {
    if (!emittedEvents) {
      return false;
    }
    for (const evt of emittedEvents) {
      for (const sce of scenario) {
        if (sce[0] && sce[0].includes(evt)) {
          return true;
        }
      }
    }
    return false;
  }

  checkIfAllOrAnyAlreadyEntered(emittedEvents) {
    for (const evt of emittedEvents) {
      const allIdxs = _.map(_.keys(_.pickBy(this.scenariosObjFormat, { insert: evt + ' ' })), Number);
      for (const idx of allIdxs) {
        if (idx > 0) {
          if (this.scenariosObjFormat[idx - 1].insert.toLowerCase() === 'all ') {
            // || this.scenariosObjFormat[idx - 1].insert.toLowerCase() === 'any ') {
            return true;
          }
        }
      }
    }
    return false;
  }

  async addAllInScenarioEditor(emittedEvents) {
    // addAllAnyInScenarioEditor - change function name to this when including all and any
    if (!emittedEvents) {
      return;
    }

    for (const val of emittedEvents) {
      const allIdxs = _.map(_.keys(_.pickBy(this.scenariosObjFormat, { insert: val + ' ' })), Number);

      // Add the all/any keyword at the location of the when keyword and assign new array to the scenario object array
      const tempObjFmtArray = _.cloneDeep(this.scenariosObjFormat);

      for (const idx of allIdxs) {
        if (idx > 0) {
          if (this.scenariosObjFormat[idx - 1].insert.toLowerCase() === 'when ') {
            // tempObjFmtArray.splice(idx, 0, {insert: 'ALL|ANY ', attributes: {bold: true, color: 'red'}});
            tempObjFmtArray.splice(idx, 0, { insert: 'all ' });
          }
        }
      }

      this.scenariosObjFormat = tempObjFmtArray;
    }
  }

  async addAllInConstraintsEditor(actor) {
    // addAllAnyInConstraintsEditor - change function name to this when including all and any
    if (!actor) {
      return;
    }
    // Add the all/any keyword at the location of the when keyword and assign new array to the scenario object array
    const tempObjFmtArray = _.cloneDeep(this.constraintsObjFormat);
    // Get all indexes where the actor is present
    const allIdxs = _.map(_.keys(_.pickBy(tempObjFmtArray, { insert: actor + ' ' })), Number);
    for (const idx of allIdxs) {
      if (idx === 1) {
        if (this.constraintsObjFormat[idx - 1].insert.toLowerCase() === 'link ' ||
          this.constraintsObjFormat[idx - 1].insert.toLowerCase() === 'lan ') {
          // tempObjFmtArray.splice(idx, 0, {insert: 'ALL|ANY ', attributes: {bold: true, color: 'red'}});
          tempObjFmtArray.splice(idx, 0, { insert: 'all ' });
          continue;
        }
      }
      if (idx > 1) {
        if ((this.constraintsObjFormat[idx - 1].insert.toLowerCase() === 'link ' ||
          this.constraintsObjFormat[idx - 2].insert.toLowerCase() === 'link ' ||
          this.constraintsObjFormat[idx - 1].insert.toLowerCase() === 'lan ' ||
          this.constraintsObjFormat[idx - 2].insert.toLowerCase() === 'lan ') &&
          (this.constraintsObjFormat[idx - 1].insert.toLowerCase() !== 'all ')) {
          // tempObjFmtArray.splice(idx, 0, {insert: 'ALL|ANY ', attributes: {bold: true, color: 'red'}});
          tempObjFmtArray.splice(idx, 0, { insert: 'all ' });
        }
      }
    }
    this.constraintsObjFormat = tempObjFmtArray;
  }

  validateAllKeywordIfPresent(constraints, actorEventObj) {
    // Filter all actors with the all keyword
    const constraintsWithNum = _.filter(constraints, (v) => v[0] === 'num');

    // First run in the scenario editor and update the object
    let tempArray = _.cloneDeep(this.scenariosObjFormat);
    let allIdxs = _.map(_.keys(_.pickBy(tempArray, { insert: 'all ' })), Number);
    for (const idx of allIdxs) {
      const actName = _.findKey(actorEventObj, (v, k) => {
        return v.includes(this.scenariosObjFormat[idx + 1].insert.trimEnd());
      });
      const numActor = _.find(constraintsWithNum, v => v[1][0] === actName);
      if (!constraintsWithNum.map(v => v[1][0]).includes(actName) ||
        (numActor && parseInt(numActor[2][0], 10) === 1)) {
        tempArray.splice(idx, 1);
      }
    }
    if (!_.isEqual(this.scenariosObjFormat, tempArray)) {
      this.scenariosObjFormat = tempArray;
    }

    // Secondly run in the constraints editor and update the object
    tempArray = _.cloneDeep(this.constraintsObjFormat);
    allIdxs = _.map(_.keys(_.pickBy(tempArray, { insert: 'all ' })), Number);
    for (const idx of allIdxs) {
      const actName = this.constraintsObjFormat[idx + 1].insert.trimEnd();
      const numActor = _.find(constraintsWithNum, v => v[1][0] === actName);
      if (!constraintsWithNum.map(v => v[1][0]).includes(actName) ||
        (numActor && parseInt(numActor[2][0], 10) === 1)) {
        tempArray.splice(idx, 1);
      }
    }
    if (!_.isEqual(this.constraintsObjFormat, tempArray)) {
      this.constraintsObjFormat = tempArray;
    }
  }

  suggestAll(parsedConstraintData: ParseApiBean) {
    // change name to suggestAllAny when adding any also
    const actorEventObj = {};
    parsedConstraintData.parsedConstraints.forEach((val) => {
      if (val[2]) {
        // Check if its in any link attribute
        const foundInLinkLan = _.find(parsedConstraintData.parsedConstraints, (vl) => {
          return (vl[0] === 'link' || vl[0] === 'lan') && vl[1].includes(val[1][0]);
        });

        // get if the Actor emits an event and get the emitted events
        const foundScenario = _.find(parsedConstraintData.parsedScenario, (vl) => {
          return vl[1].includes(val[1][0]);
        });
        const emittedEvents = foundScenario ? foundScenario[3] : [];
        // this.validateAllKeywordIfPresent(val[1][0], emittedEvents, val);

        actorEventObj[val[1][0]] = emittedEvents;
        // if it has a link attribute or its emitted event is waited for my some node
        if (val[0] === 'num' && parseInt(val[2][0], 10) > 1 && (foundInLinkLan || (this.checkIfEmittedEventIsATriggerEvent(emittedEvents,
          parsedConstraintData.parsedScenario) && !this.checkIfAllOrAnyAlreadyEntered(emittedEvents)))) {
          // this.alertMessage = 'You should have an ALL or ANY preceding ' + val[1][0] + '. Please see the documentation';
          this.alertMessage = 'An ALL keyword has been inserted preceding ' + val[1][0] +
            ' and/or its events as it maps to multiple nodes. Please see the documentation';
          this.showAlertMsg = true;
          setTimeout(() => {
            this.showAlertMsg = false;
          }, 5000);

          // add all in the scenarios and constraints
          Promise.all([this.addAllInScenarioEditor(emittedEvents), this.addAllInConstraintsEditor(val[1][0])])
            .then((done) => {
              // Still have to resolve the promises part. This is a hack and ugly way of doing it
              setTimeout(() => {
                this.stateservice.setBehavior(this.getScenariosFromEditor());
                this.stateservice.setConstraints(this.getConstraintsFromEditor());
              }, 1000);
            });
          this.stateservice.setAllAnyPresentFlag(true);
        }
      }
    });
    this.validateAllKeywordIfPresent(parsedConstraintData.parsedConstraints, actorEventObj);
  }

  toggleSpecialFuncDialog() {
    this.showSpecialFuncDialog = !this.showSpecialFuncDialog;
  }

  unsetShowAlertMessage() {
    this.showAlertMsg = false;
  }

  extractScenario(scenario) {
    // console.log(scenario);
    // this.bindingMap = new Map<String,any>();
    this.bindingList = [];
    const trigger = [];
    scenario.forEach((element) => {
      this.extractActors(element[1] != null ? element[1] : []);

      if (element[0] != null) {
        element[0].map((x) => {
          if (!trigger.includes(x)) {
            trigger.push({ key: x, category: 't_event', value: '' });
          }
        });
      }

      if (element[2] != null) {
        element[2].map((x) => {
          if (!trigger.includes(x)) {
            trigger.push({ key: x, category: 'action', value: '' });
          }
        });
      }

      if (element[3] != null) {
        element[3].map((x) => {
          if (!trigger.includes(x)) {
            trigger.push({ key: x, category: 'event', value: '' });
          }
        });
      }
    });
    this.extractEvents(trigger);
    this.extractTriggers(trigger);

    // this.loadBindings();
    this.changeDetection.detectChanges();
  }

  extractTriggers(triggers) {
    this.triggerSignals = []
    for (var item of triggers) {
      if (item['category'] != 'action') {
        if (!this.triggerSignals.includes(item['key'])) {
          this.triggerSignals.push(item['key']);
        }
      }
    }
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
    if (triggers != null) {
      triggers.forEach((element) => {
        if (!this.bindingMap.has(element.key)) {
          this.bindingMap.set(element.key, element);
          this.bindingList.push(element);
        } else {
          if (!this.bindingList.some(e => e.key === element.key)) {
            this.bindingList.push(this.bindingMap.get(element.key));
          }
        }
      });
    }
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
    // if (this.behaviorService.getText().trim() === "") return;
    // var index = this.behaviorService.getText().length-2;
    // if (this.behaviorService.getText().charAt(index) == '\n')
    //     this.updateActors();
  }
  logChangeConstraints(event) {
    // if (this.constraintService.getText().trim() === "") return;
    // //console.log(this.constraintService.getText().charAt(this.constraintService.getText().length-1))
  }
  insertValue(text: any, flag: boolean = false) {
    // console.log("word:"+text);
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

  showInfo(id: number) {
    //console.log(this.bindingList);

    var dialogRef = this.dialog.open(HLBInforPopUp, {
      width: "70%",
      data: id,
    });
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
    this.http
      .put("v1/pr/hlb/generateNs", data, { withCredential: true })
      .subscribe(
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
  storeBinding(index) {
    const str1 = ' - file exists';
    const str2 = ' - file was modified';
    const str3 = ' - process exists that performs action in the binding';
    const str4 = ' - process completed w success for the given action';

    // This part is done just to remove the the description
    if (index && (this.bindingList[index].value.includes(str1) || this.bindingList[index].value.includes(str2) ||
      this.bindingList[index].value.includes(str3) || this.bindingList[index].value.includes(str4))) {
      const splitter = this.bindingList[index].value.split(' - ');
      this.bindingList[index].value = splitter[0];
    }
    this.stateservice.setBindings(this.bindingList);
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
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: "hlb-info",
  templateUrl: "hlb-info.component.html",
  styleUrls: ["./hlb.component.scss"],
})
export class HLBInforPopUp {
  constructor(
    public dialogRef: MatDialogRef<HLBInforPopUp>,
    @Inject(MAT_DIALOG_DATA) public showId: number
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}

var currentGraphItemSelection = {};
var globalGraphItemParametersList;
var id_of_node = {};
var id_of_edge = {};
let accessibleLogger;
let entry = new LogEntry();
var graphColors;

function swapJSON(data) {
  var temp = {};
  for (var i in data) {
    temp[data[i]] = i;
  }
  return temp;
}


function showRelevantContentInDialogBox() {
  try {
    var temp = globalGraphItemParametersList[currentGraphItemSelection['id']];
    if (!temp) {
      $('#node-ip-address').val('');
      $('#node-operating-system').val('');
      $('#node-hardware-type').val('');
      $('#node-num').val('');
      $('#link-bandwidth').val('');
      $('#link-delay').val('');
    } else {
      $('#node-ip-address').val(temp.ipAddress);
      $('#node-operating-system').val(temp.operatingSystem);
      $('#node-hardware-type').val(temp.hardwareType);
      $('#node-num').val(temp.num);
      $('#link-bandwidth').val(temp.bandwidth);
      $('#link-delay').val(temp.delay);
    }
  } catch (ex) {
    //Do nothing
  }
}