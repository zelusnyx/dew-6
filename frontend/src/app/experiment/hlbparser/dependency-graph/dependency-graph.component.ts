import { Component, OnInit, Input, Output, EventEmitter, ViewChild, HostListener } from '@angular/core';
import { Edge, Node, Layout, ClusterNode, NodePosition, GraphComponent } from '@swimlane/ngx-graph';
import { Subject } from 'rxjs';
import * as shape from 'd3-shape';
import { HttpService } from "src/app/http-service.service";
import { StateService } from "src/app/state-service.service";


@Component({
  selector: 'dependency-graph',
  templateUrl: './dependency-graph.component.html',
  styleUrls: ['./dependency-graph.component.scss']
})
export class DependencyGraphComponent implements OnInit{
  @Output() navigate: EventEmitter<any> = new EventEmitter();
  public nodes: Node[] = [];
  public links: Edge[] = [];
  public layout: String | Layout = 'dagreCluster';
  public layoutSettings = {
    orientation: "TB"
  }
  public clusters = [];
  public clusters2 = [];

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

  zoomLevel: number = 1.0;
  zoomSpeed: number = 0.1;
  minZoomLevel: number = 0.1;
  maxZoomLevel: number = 4.0;
  panOnZoom: boolean = true;

  autoZoom: boolean = false;
  autoCenter: boolean = true; 

  showClusters: boolean = false;

  isDragging: boolean = false;
  draggingNode: Node = null;

  public currentDragPosition: NodePosition = {x: 0, y: 0};
  public startingDragPosition: NodePosition = {x: 0, y: 0};
  mouseOverNode: Node = null;

  @ViewChild('graph', { static: false }) graphEl: GraphComponent;


  update$: Subject<boolean> = new Subject();
  center$: Subject<boolean> = new Subject();
  zoomToFit$: Subject<boolean> = new Subject();

  constructor(
    protected http: HttpService,
    protected state: StateService
  ) {
  }

  public ngOnInit(): void {
    this.state.getExperimentColors().subscribe((d) => {
      this.matching = d
    })
    this.state.getBehavior().subscribe((behavior) => {
      this.http.put("v1/pr/hlb/dependency_graph/parse", {"scenario": behavior}, {withCredential: true}).subscribe((d) => {
        this.nodes = []
        this.links = []
        this.clusters = []
        var actors = {}
        var c2: ClusterNode[] = []
        for (const n of d['nodes']) {
          var n2: Node = {
            data: n,
            id: n.id,
            label: n.actors[0]
          }
          if(actors.hasOwnProperty(n.actors[0])){
            actors[n.actors[0]].push(n.id)
          }else{
            actors[n.actors[0]] = [n.id]
          }
          this.nodes.push(n2)
          this.nodes =  [...this.nodes]
        }

        for(const [actor, values] of Object.entries(actors)){
          console.log(values)
          var c1: ClusterNode = {
            id: actor,
            label: actor,
            childNodeIds: actors[actor],
          }
          c2.push(c1)
        }

        for(const e of d['edges']){
          var e2: Edge = e
          this.links.push(e2)
          this.links = [...this.links]
        }
        this.clusters2 = c2;
        if(this.showClusters){
          this.clusters = c2;
        }
        this.update$.next(true);
      })
    })

  }

  /**
   * toggleDragging
   */
  public toggleDragging() {
    this.draggingEnabled = !this.draggingEnabled
    console.log(this.nodes)
    this.update$.next(true)
  }

  public toggleClusters(){
    this.showClusters = !this.showClusters
    var x = this.clusters
    this.clusters = this.clusters2
    this.clusters2 = x
    this.update$.next(true)
  }

  /**
   * getAllOrAnyKeyword
   */
  public getAllOrAnyKeyword(link) {
    if(link.data.all_or_any !== ""){
      return "url(#"+link.data.all_or_any+"_keyword)"
    }else{
      return ""
    }
  }

  /**
   * showWaitTime
   */
  public showWaitTime(wait_time) {
    if(wait_time === "None"){
      return "hidden"
    }else{
      return "visible"
    }
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

  /**
   * getColor
node   */
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

  /**
   * zoomIn
   */
  public zoomIn() {
    this.graphEl.zoom(1.1)
  }

  /**
   * zoomOut
   */
  public zoomOut() {
    this.graphEl.zoom(0.9)
  }

  public fitToView() {
    this.zoomToFit$.next(true)
  }

  /**
   * getCloseBoxHeight
   */
  public getCloseBoxHeight() {
    if(this.draggingEnabled){
      return 0;
    }else{
      return 20;
    }
  }

  /**
   * getCloseBoxWidth
   */
  public getCloseBoxWidth() {
    if(this.draggingEnabled){
      return 0;
    }else{
      return 20;
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

  /**
   * On node circle mouse down to kick off dragging
   *
   */
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
    
    if(src.id == dest.id){
      return;
    }


    var edge: Edge = {
      id: Math.random().toString(36).substring(7),
      source: this.draggingNode.id,
      target: dest.id,
      label: this.draggingNode.label + "Run" + this.draggingNode.data.action + "Sig",
      data: {
        all_or_any: ""
      }
    }

    if(src.data['e_events'].indexOf(edge.label) === -1){
      src.data['e_events'].push(edge.label)
    }
    if(dest.data['t_events'].indexOf(edge.label) === -1){
      dest.data['t_events'].push(edge.label)
    }

    var reconstructedString = this.reconstructDEW(src)

    var reconstructedString2 = this.reconstructDEW(dest)

    var behaviors = null
    this.state.behavior.subscribe((b) => {
      behaviors = b
    })

    var bindings = null
    this.state.bindings.subscribe((b) => {
      bindings = b
    })
    bindings.push({key: edge.label, category: "event", value: ""})

    behaviors[parseInt(src.id)-1] = reconstructedString
    behaviors[parseInt(dest.id)-1] = reconstructedString2

    this.state.setBehavior(behaviors)
    this.state.setBindings(bindings)

    this.links.push(edge)
    this.links = [...this.links]

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
   * deleteEdge
   */
  public deleteEdge(event: any, edge: Edge): void {
    if(this.draggingEnabled){
      return;
    }
    this.links = this.links.filter((e) => {
      return e.id != edge.id
    })


    var src: Node = this.nodes.find((n)=> { return n.id === edge.source })
    var dest: Node = this.nodes.find((n)=> { return n.id === edge.target })

    src.data.e_events.splice(src.data.e_events.indexOf(edge.label),1)
    dest.data.t_events.splice(dest.data.t_events.indexOf(edge.label),1)


    // TODO: Move into a method

    var reconstructedString = this.reconstructDEW(src)

    var reconstructedString2 = this.reconstructDEW(dest)

    var behaviors = null
    this.state.behavior.subscribe((b) => {
      behaviors = b
    })

    behaviors[parseInt(src.id)-1] = reconstructedString
    behaviors[parseInt(dest.id)-1] = reconstructedString2

    this.state.setBehavior(behaviors)

    var bindings = null
    this.state.getBindings().subscribe((b) => {
      bindings = b
    })

    bindings = bindings.filter((e) => {return e.key !== edge.label})
    this.state.setBindings(bindings)

  }

  /**
   * getMatching
   */
  public getMatching() {
    return this.matching
  }

  private reconstructDEW(node: Node) {
    var reconstructedString = ""
    if(node.data['t_events'].length > 0){
      reconstructedString += "when " + node.data['t_events'].join(", ") + " "
    }
    if(node.data['wait_time'] !== "None"){
      reconstructedString += " wait " + JSON.parse(node.data['wait_time'].replace(/'/g, '"')).join(",") + " "
    }
    reconstructedString += node.data['actors'].join(", ") + " " + node.data["action"] + " "
    if(node.data['e_events'].length > 0){
      reconstructedString += "emit " +  node.data['e_events'].join(", ")
    }
    return reconstructedString
  }

  showSlides(){
    this.navigate.emit(4)
  }

  showEditor(){
    this.navigate.emit(1)
  }
}