import { Component, Output, EventEmitter, OnInit, Inject, Input, ViewChild, HostListener } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatSnackBar } from '@angular/material';
import { Edge, Node, Layout, ClusterNode, NodePosition, GraphComponent } from '@swimlane/ngx-graph';
import { Subject } from 'rxjs';
import * as shape from 'd3-shape';
import { HttpService } from "src/app/http-service.service";
import { StateService } from "src/app/state-service.service";


@Component({
  selector: 'single-experiment-slide',
  templateUrl: './single-slide.component.html',
  styleUrls: ['./single-slide.component.scss']
})
export class SingleSlideComponent implements OnInit{
  @Output() navigate: EventEmitter<any> = new EventEmitter();
  public nodes: Node[] = [];
  public links: Edge[] = [];
  public layout: String | Layout = 'dagreCluster';
  public layoutSettings = {
    orientation: "TB"
  }
  actorForm;
  curveType: string = 'Bundle';
  curve: any = shape.curveLinear;
  interpolationTypes = [
    'Bundle',
    'Cardinal',
    'Catmull Rom',
    'Linear',
    'Monotone X',
    'Monotone Y',
    'Natural',
    'Step',
    'Step After',
    'Step Before'
  ];  

  draggingEnabled: boolean = true;
  panningEnabled: boolean = true;
  zoomEnabled: boolean = false;
  zoomLevel: number = 1.0;
  zoomSpeed: number = 0.1;
  minZoomLevel: number = 0.1;
  maxZoomLevel: number = 4.0;
  panOnZoom: boolean = true;

  experimentId : number = -1;
    customColors = [
    "#bf9d76",
    "#f2dfa7",
    "#a5d7c6",
    "#afafaf",
    "#ba9383",
    "#d9d5c3",
    "#55C22D",
    "#C1F33D",
    "#3CC099",
    "#AFFFFF",
    "#8CFC9D",
    "#76CFFA",
    "#FC9F32",
  ]

  matching: {[key: string]: string} = {}

  autoZoom: boolean = false;
  autoCenter: boolean = true; 


  isDragging: boolean = false;
  draggingNode: Node = null;

  slide: any = {};

  public currentDragPosition: NodePosition = {x: 0, y: 0};
  public startingDragPosition: NodePosition = {x: 0, y: 0};
  mouseOverNode: Node = null;

  @ViewChild('graph', { static: false }) graphEl: GraphComponent;

  update$: Subject<boolean> = new Subject();
  zoomToFit$: Subject<boolean> = new Subject();

  constructor(
    protected http: HttpService,
    protected state: StateService,
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private formBuilder: FormBuilder
  ) {
  }

  public ngOnInit(): void {

    this.state.getExperimentColors().subscribe((d) => {
      this.matching = d
    })

    this.drawGraph()

    this.state.getslideTobeShown().subscribe((slide) => {
      this.slide = slide;
    })

    this.state.getExperimentId().subscribe((id) => {
      this.experimentId = id;
    })

  }

  public backtoList() {
    this.navigate.emit(4);
  }

  public getColor(node) {
    const existingColors = Object.values(this.matching)
    if(this.matching.hasOwnProperty(node.label)){
      return this.matching[node.label]
    }
    else{
      var c = this.customColors[Math.floor(Math.random() * this.customColors.length)]
      while (existingColors.includes(c)) {
        c = this.customColors[Math.floor(Math.random() * this.customColors.length)]
      }
      this.matching[node.label] = c
      this.state.setExperimentColors(this.matching)
      return c
    }

  }

  public showMappingPopup(node){
    if(node.data.type == "lan"){
      return;
    }
    var dialogRef = this.dialog.open(UpdateSlideMapping, {
      width: "60%",
      data: { actor: node.label, slide: this.slide}
    });
    
  }

  public getTitle(node){
    if(node.data.type == "actor"){
      return "num : " + node.data.num + ", os: " + node.data.os
    }else {
      return ""
    }
  }

  createSlide(){
    var lastSequenceNumber;
      this.state.getlastSlideSeqNum().subscribe((n) => 
        {lastSequenceNumber = n;}
      )
    if(this.experimentId < 1){
      this._snackBar.open("Please save the experiment to continue!", "OK", {
        duration: 10000,
      });
    } else {
      this.http.post("api/v1/pr/design/experiment/slides",
        {"experiment_id": this.experimentId,
         "sequence_number": lastSequenceNumber + 1},{withCredential: true}).subscribe((data) => {
        this.slide = data['slide']
        this.state.setlastSlideSeqNum(lastSequenceNumber+1);
        this._snackBar.open("Created new slide successfully!", "OK", {duration: 4000,});
      })
    }
  }


  public getSubText(node){
    if(node.data.type == "actor"){
      return "(" + node.data.num + "), ("+node.data.os+")"
    } else
    {
      return ""
    }
  }

  public isLanNode(node, dim){
    if(node.data.type == "lan"){
      if(dim == 'x'){
        return node.dimension.width
      }else{
        return node.dimension.height
      }
    }else{
      return "0"
    }
  }

  public zoomIn(){
    this.graphEl.zoom(1.1)
  }

  public zoomOut(){
    this.graphEl.zoom(0.9)
  }

  public fitToView(){
    this.zoomToFit$.next(true)
  }

  /**
   * toggleDragging
   */
  public toggleDragging() {
    this.draggingEnabled = !this.draggingEnabled
    this.update$.next(true)
  }

  /**
   * isEditable
   */
  public isEditable() {
    if(this.draggingEnabled){
      return "hidden"
    }else{
      return "visible"
    }
  }
  
  private drawGraph(){
    var behaviors = null
    var constraints = null
    this.state.getConstraints().subscribe((c) => {
      constraints = c || []
    })
    this.state.getBehavior().subscribe((b) => {
      behaviors = b || []
    })
    this.http.put("v1/pr/hlb/topology/parse", {"scenario": behaviors, "constraints": constraints},{withCredential: true}).subscribe((data) => {
      this.nodes = []
      this.links = []
      for(const n in data['actors']){
        var n2: Node = {
          data: data['actors'][n],
          id: n,
          label: n
        }
        this.nodes.push(n2)
        this.nodes =  [...this.nodes]
      }

      for(const n of data['lans']){
        var n2: Node = {
          data: n,
          id: "lan" + n['lineNum'],
          label: "lan"
        }
        this.nodes.push(n2)
        this.nodes =  [...this.nodes]
      }

      for(const e of data['edges']){
        var e2: Edge = e
        this.links.push(e2)
        this.links = [...this.links]
      }
    })
  }

  private redrawGraph(){
    this.nodes = []
    this.links = []
    this.drawGraph()
  }

}

@Component({
  selector: "update-slide-mapping",
  templateUrl: "action-popup.component.html",
  styleUrls: ['./single-slide.component.scss']
})
export class UpdateSlideMapping implements OnInit {

  actor: string;
  experimentId: number;
  slide: any;
  action: string;
  mapping: any;
  bindingMapping: any;
  binding: string = undefined;

  constructor(public dialogRef: MatDialogRef<UpdateSlideMapping>,
    protected http: HttpService,
    protected state: StateService,
    private _snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public input: any) {}

  ngOnInit(): void{
    this.actor = this.input.actor;
    this.slide = this.input.slide;
    this.state.getExperimentId().subscribe(data => this.experimentId = data);
    this.mapping = JSON.parse(this.slide['actor_action_mapping']);
    this.bindingMapping = JSON.parse(this.slide['action_binding_mapping']) || {};
    this.action = this.mapping[this.actor];
    this.binding = this.bindingMapping[this.action];
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  updateActorActionMapping() {
    console.log("action: ", this.action);
    this.mapping[this.actor] = this.action;
    if(this.binding != undefined){
      this.bindingMapping[this.action] = this.binding;
    }
    this.slide['actor_action_mapping'] = JSON.stringify(this.mapping);
    this.slide['action_binding_mapping'] = JSON.stringify(this.bindingMapping);
    console.log("mapping: ", this.mapping);
    var requestData = {
      "experiment_id": this.experimentId.toString(),
      "slide_id": this.slide['slide_id'].toString(),
      "actor_action_mapping": this.slide['actor_action_mapping'],
      "action_binding_mapping": this.slide['action_binding_mapping']
    }
    this.http.put("v1/pr/design/experiment/slides", requestData, {withCredential: true}).subscribe((response)=> {
      this.state.setslideTobeShown(this.slide);
      this.dialogRef.close();
    });
  }
}