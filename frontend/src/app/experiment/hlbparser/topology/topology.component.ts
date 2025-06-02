import { Component, OnInit, Inject, Input, Output, EventEmitter, ViewChild, HostListener } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatSnackBar } from '@angular/material';
import { Edge, Node, Layout, ClusterNode, NodePosition, GraphComponent } from '@swimlane/ngx-graph';
import { Subject } from 'rxjs';
import * as shape from 'd3-shape';
import { HttpService } from "src/app/http-service.service";
import { StateService } from "src/app/state-service.service";


@Component({
  selector: 'topology-graph',
  templateUrl: './topology.component.html',
  styleUrls: ['./topology.component.scss']
})
export class TopologyGraphComponent implements OnInit{
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
    private formBuilder: FormBuilder
  ) {
  }

  public ngOnInit(): void {
    this.state.getExperimentColors().subscribe((d) => {
      this.matching = d
    })

    this.drawGraph()

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

  public showPopup(node){
    alert("node.label: " + node.label)
  }

  public getTitle(node){
    if(node.data.type == "actor"){
      return "num : " + node.data.num + ", os: " + node.data.os
    }else {
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

  public addActor(event){
    event.preventDefault();
    event.stopPropagation();
    const id = (this.nodes.length+1).toString()
    var node: Node = {
      data: {
        'num': 1,
        'os': 'default',
        'type': 'actor'
      },
      id: id,
      label: 'actor' + id.toString()
    }
    var newConstraints = this.generateConstraintDEW(node)
    var oldConstraints = null;
    this.state.getConstraints().subscribe(c => {
       oldConstraints = c || []
    })
    newConstraints = oldConstraints.concat(newConstraints)
    this.state.setConstraints(newConstraints)
    this.nodes.push(node)
    this.nodes = [...this.nodes]
  }

  public getSubText(node){
    if(node.data.type == "actor"){
      return "(" + node.data.num + "), ("+node.data.os+")"
    } else
    {
      return ""
    }
  }

  public addLan(event){
    event.preventDefault();
    event.stopPropagation();
    const id = (this.nodes.length+1).toString()
    var node: Node = {
      data: {
        'type': 'lan',
        actors: [],
        lineNum: null

      },
      id: id,
      label: 'lan'
    }

    this.addLanDEW(node)

    this.nodes.push(node)
    this.nodes = [...this.nodes]
  }

  public editNode(event,node){
    if(node.data.type !== "actor"){
      return
    }
    event.preventDefault()
    event.stopPropagation()
    var dialogRef = this.dialog.open(UpdateActorInfo, {
      width: "60%",
      data: node
    });
    dialogRef.afterClosed().subscribe((result) => {
      delete this.matching[node.label]
      this.state.setExperimentColors(this.matching)
      this.redrawGraph()
    })
  }

  private generateConstraintDEW(node){
    if(node.data.type == "lan"){
       // var nodes = this.getLanNodes(node)
       this.addLanDEW(node)
    } else {
      var str = []
      str.push("num " + node.label + " " + node.data.num)
      if(node.data.os != "default"){
        str.push("os " + node.label + " " + node.data.os)
      }
      return str
    }
  }

  private addLinkDEW(source, target){
    if(source.data.type == "actor" && target.data.type == "actor"){
      return ["link all "+ source.label + " " + target.label]
    } else if(source.data.type == "lan" && target.data.type == "actor"){
      source.data.actors.push(target.label)
      this.addLanDEW(source)
    } else if(source.data.type == "actor" && target.data.type == "lan"){
      target.data.actors.push(source.label)
      this.addLanDEW(target)
    }
  }

  private addLanDEW(lannode){
    if (lannode.data.actors.length < 2) {
      return
    }
    this.updateLanDEW(lannode)
  }

  private removeLanDEW(lannode){
    var oldConstraints = null;
    this.state.getConstraints().subscribe(c => {
       oldConstraints = c
    })
    oldConstraints.splice(parseInt(lannode.data.lineNum),1)
    this.state.setConstraints(oldConstraints)
  }

  private updateLanDEW(lannode){
    if (lannode.data.type != 'lan') {
      return
    }
    if(lannode.data.actors.length < 2){
      this.removeLanDEW(lannode)
    }
    else {
      var str = "lan all " + lannode.data.actors.join(" ")
      var oldConstraints = null;
      this.state.getConstraints().subscribe(c => {
         oldConstraints = c
      })
      if (lannode.data.lineNum) {
        oldConstraints[parseInt(lannode.data.lineNum)] = str
      }else{
        oldConstraints.push(str)
        lannode.data.lineNum = oldConstraints.length - 1
      }
      
      this.state.setConstraints(oldConstraints)
    }

  }

  /**
   * On mouse up event
   *
   */
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) {
      return;
    }
    this.currentDragPosition.x += event.movementX / this.graphEl.zoomLevel;
    this.currentDragPosition.y += event.movementY / this.graphEl.zoomLevel;
  }

  /**
   * On mouse up event
   *
   */
  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (this.isDragging && this.draggingNode) {
      // logic if mouse is released over another node
      console.log(event, this.draggingNode)
    }

    this.isDragging = false;
    this.draggingNode = undefined;
  }

  onNodeCircleMouseDown(event: any, node: Node): void {
    if (this.draggingEnabled) {
      return;
    }
    this.isDragging = true;

    this.draggingNode = node;

    this.startingDragPosition = {
      x: (event.layerX - this.graphEl.panOffsetX) / this.graphEl.zoomLevel,
      y: (event.layerY - this.graphEl.panOffsetY) / this.graphEl.zoomLevel
    };

    this.currentDragPosition = {
      x: (event.layerX - this.graphEl.panOffsetX) / this.graphEl.zoomLevel,
      y: (event.layerY - this.graphEl.panOffsetY) / this.graphEl.zoomLevel
    };

    setTimeout(() => {
      this.mouseOverNode = undefined;
    });
  }

  onNodeCircleMouseUp(event: any, node: Node): void {
    if (this.draggingEnabled) {
      return;
    }
    this.isDragging = false;
    var src = this.draggingNode;
    var dest = node;
    
    if((src.id == dest.id) || (src.data.type == "lan" && dest.data.type == "lan")){
      return;
    }


    var edge: Edge = {
      id: Math.random().toString(36).substring(7),
      source: this.draggingNode.id,
      target: dest.id,
      label: ""
    }

    this.links.push(edge)
    this.links = [...this.links]

    var newConstraints = this.addLinkDEW(this.draggingNode, dest)
    if (newConstraints) {
      var oldConstraints = null;
      this.state.getConstraints().subscribe(c => {
         oldConstraints = c
      })
      newConstraints = oldConstraints.concat(newConstraints)
      this.state.setConstraints(newConstraints)
    }


    this.startingDragPosition = {
      x: (event.layerX - this.graphEl.panOffsetX) / this.graphEl.zoomLevel,
      y: (event.layerY - this.graphEl.panOffsetY) / this.graphEl.zoomLevel
    };

    this.currentDragPosition = {
      x: node.position.x + node.dimension.width / 2,
      y: node.position.y
    };

    setTimeout(() => {
      this.mouseOverNode = undefined;
    });
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

  public removeEdge(edge){
    if(this.draggingEnabled){
      return;
    }
    this.links = this.links.filter((e) => {
      return e.id != edge.id
    })
    var source = this.nodes.find(node => node.id == edge.source)
    var target = this.nodes.find(node => node.id == edge.target)
    var newConstraints = this.removeLinkDEW(source, target)

    if (newConstraints) {
      this.state.setConstraints(newConstraints)
    }
    this.redrawGraph()

  }

  private removeLinkDEW(source, target){
    if(source.data.type == "actor" && target.data.type == "actor"){
      const dew = "link all "+ source.label + " " + target.label
      const dew2 = "link "+ source.label + " " + target.label
      var oldConstraints = null;
      this.state.getConstraints().subscribe(c => {
        oldConstraints = c
      })
      return oldConstraints.filter(constraint => constraint != dew && constraint != dew2)
    } else if(source.data.type == "lan" && target.data.type == "actor"){
      source.data.actors = source.data.actors.filter(n => n !== target.label)
      this.updateLanDEW(source)
    } else if(source.data.type == "actor" && target.data.type == "lan"){
      target.data.actors = target.data.actors.filter(n => n !== source.label)
      this.updateLanDEW(target)
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

  public removeNode(node){
    if(this.draggingEnabled){
      return;
    }
    var dependentEdges = this.links.filter(edge => edge.source == node.id || edge.target == node.id)
    if(dependentEdges.length > 0){
      alert("Please remove all dependent edges before removing the node.")
      return
    }else{
      if(node.data.type == "lan"){
        this.removeLanDEW(node)
      }else{
        var numConstraint = "num " + node.label + " " + node.data.num
        var osConstraint = "os " + node.label + " " + node.data.os

        var constraints = null;
        this.state.getConstraints().subscribe(c => {
          constraints = c
        })
        constraints = constraints.filter(c => c != numConstraint && c != osConstraint)
        this.state.setConstraints(constraints)

        var behaviors = [];
        this.state.getBehavior().subscribe(b => {
          behaviors = b
        });
        behaviors = behaviors.filter(b => !b.includes(node.label));
        this.state.setBehavior(behaviors);
      }
      delete this.matching[node.label]
      this.state.setExperimentColors(this.matching)
    }
    this.redrawGraph()
  }
  showSlides(){
    this.navigate.emit(4)
  }

  showEditor(){
    this.navigate.emit(1)
  }
}

@Component({
  selector: "update-actor",
  templateUrl: "actor-info.component.html",
  styleUrls: ['./topology.component.scss']
})
export class UpdateActorInfo implements OnInit {

  numIndex: number
  osIndex: number
  constraints: any;
  newLabel: string
  oldLabel: RegExp;
  
  constructor(public dialogRef: MatDialogRef<UpdateActorInfo>,
    protected http: HttpService,
    protected state: StateService,
    private _snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public actor: any) {}

  ngOnInit(): void{
    this.state.getConstraints().subscribe(constraints => {
      this.constraints = constraints
    })
    this.numIndex = this.constraints.indexOf("num " + this.actor.label + " " + this.actor.data.num)
    this.osIndex = this.constraints.indexOf("os " + this.actor.label + " " + this.actor.data.os)
    this.newLabel = this.actor.label
    this.oldLabel = new RegExp(`\\b${this.actor.label}\\b`, "g")
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  updateActorConstraints() {
    this.constraints[this.numIndex] = "num " + this.newLabel + " " + this.actor.data.num
    this.constraints[this.osIndex] = "os " + this.newLabel + " " + this.actor.data.os
    for(var i=0; i < this.constraints.length; i++){
      this.constraints[i] = this.constraints[i].replace(this.oldLabel,this.newLabel)
    }
    this.state.setConstraints(this.constraints);
    this.dialogRef.close();
  }
}