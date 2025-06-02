import { Component, ElementRef, Inject, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { HttpService } from 'src/app/http-service.service';
import { Router } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { MatDialog, MatDialogRef, MatSnackBar, MAT_DIALOG_DATA } from '@angular/material';
import { DataSet } from 'vis-data';
import { Network } from 'vis-network';

@Component({
    selector: 'current-info',
    templateUrl: './current-info.component.html',
    styleUrls: ['./current-info.component.scss']
})

export class CurrentInfoComponent implements OnInit, OnChanges {
    @Input() experiment_id: Number
    @Input() account_id: Number
    @Input() doRefresh: boolean
    @ViewChild('currentInfoNetwork', { static: false }) currentInfoNetwork!: ElementRef;
    logList: []
    error: String
    errorFlag: boolean = false
    logid: String
    executionScript = []
    filteredExecutionScript = []
    loader = false
    refreshIntervalId = null

    private dependencyNetworkInstance: any;

    dependencyGraphNodes: DataSet<any>;
    dependencyGraphEdges: DataSet<any>;
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
    graphImages = {
        successImage: null,
        errorImage: null,
        inProgressImage: null,
        waitingImage: null
    }

    statusLegends = [
        { label: 'Success', img: '/assets/checked.png' },
        { label: 'Error', img: '/assets/warning.png' },
        { label: 'In Progress', img: '/assets/inprogress.png' },
        { label: 'Waiting', img: '/assets/stopwatch.png' }
    ]
    constructor(private http: HttpService
        , private _snackBar: MatSnackBar

    ) { }
    ngOnChanges(changes: SimpleChanges): void {
        if (changes.account_id !== undefined) {
            this.account_id = changes.account_id.currentValue
        }

        if (changes.experiment_id !== undefined) {
            this.experiment_id = changes.experiment_id.currentValue
        }
        this.ngOnInit()
    }
    ngOnInit(): void {
        this.logList = []
        this.executionScript = []
        console.log("inside Current Info Component" + this.experiment_id + ":" + this.account_id)

        this.graphImages.successImage = new Image();
        this.graphImages.successImage.src = '/assets/checked.png';
        this.graphImages.errorImage = new Image();
        this.graphImages.errorImage.src = '/assets/warning.png';
        this.graphImages.inProgressImage = new Image();
        this.graphImages.inProgressImage.src = '/assets/inprogress.png';
        this.graphImages.waitingImage = new Image();
        this.graphImages.waitingImage.src = '/assets/stopwatch.png';

        if (this.experiment_id != undefined && this.account_id != undefined) {
            this.getRunLogs();
            this.showDependencyGraph();
        }
    }

    getRunLogs() {
        this.logList = []
        this.errorFlag = false
        let url = 'v1/pr/deter/project/run/logs?eid=' + this.experiment_id + '&account_id=' + this.account_id;
        this.http.get(url, { withCredentials: true })
            .subscribe(data => {
                if (data.logs != undefined && data.logs.length != 0) {
                    this.logList = data.logs.reverse();
                    this.logid = data.logs[0].id

                } else {
                    this.error = data.error
                    this.errorFlag = true
                }
            });
    }

    onSelectionChange (display) {
        if(display){
            setTimeout(() => {
                this.dependencyNetworkInstance.fit();
                this.showDetails();
            },500);
            this.refreshIntervalId = setInterval(() => {
                if(this.doRefresh){
                    this.showDetails();
                }
            }, 30000);
        }else{
            clearInterval(this.refreshIntervalId);
        }
    }

    showDetails() {
        console.log(this.logid)
        this.errorFlag = false
        this.loader = true
        let params = {
            rid: this.logid,
            account_id: this.account_id,
            eid: this.experiment_id,
            b: 20,
        }
        this.http.post('/api/v1/pr/deter/project/run/get', params, { withCredentials: true })
            .subscribe(data1 => {
                this.loader = false
                if (data1.error == undefined) {
                    console.log("showDetails", data1.data);
                    this.executionScript = data1.data
                    if (this.dependencyNetworkInstance) {
                        this.updateGraphStats()
                    }
                }
                else {
                    console.log(data1.error)
                    this._snackBar.open(data1.error, 'close', {
                        duration: 2000,
                    });
                }
            }, error => {
                this.loader = false
                this._snackBar.open('Something went wrong please try again later!', 'close', {
                    duration: 2000,
                });
            });
    }

    showDependencyGraph() {
        this.http
            .post("api/v1/pr/persist/getExperimentById", { id: this.experiment_id }, { withCredential: true })
            .subscribe((data) => {

                const request = {
                    ParseType: 'bash',
                    scenario: data.behaviors,
                    constraints: data.constraints,
                };

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
                                counters: { success: 0, error: 0, inProgress: 0, waiting: 0 },
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
                            links.push(e2)
                        }

                        const graphGroups = Object.assign({}, ...this.graphColors.map((color, index) => ({ ["group" + (index)]: { color } })));

                        this.dependencyGraphNodes = new DataSet<any>(nodes);
                        this.dependencyGraphEdges = new DataSet<any>(links);

                        this.http.put("v1/pr/hlb/dependency-graph/get-node-count", {
                            scenarios: data.behaviors,
                            constraints: data.constraints,
                            bindings: data.bindings,
                        }, { withCredential: true })
                            .subscribe((receivedData) => {
                                this.dependencyGraphNodes.forEach((node) => {
                                    const num = receivedData.nodeCountData[node.label];
                                    this.dependencyGraphNodes.update({ id: node.id, totalNode: num })
                                })
                            })

                        this.dependencyNetworkInstance = new Network(this.currentInfoNetwork.nativeElement, { nodes: this.dependencyGraphNodes, edges: this.dependencyGraphEdges }, {
                            layout: {
                                hierarchical: {
                                    sortMethod: "directed",
                                    shakeTowards: "leaves",
                                    treeSpacing: 150,
                                    levelSeparation: 100,
                                    nodeSpacing: 500,
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
                                hierarchicalRepulsion: {
                                    nodeDistance: 160
                                }
                            }
                        });

                        //Show legends in dependency graph
                        this.dependencyNetworkInstance.on("afterDrawing", (ctx) => {

                            this.dependencyGraphNodes.forEach((node) => {
                                var nodePosition = this.dependencyNetworkInstance.getPosition(node.id);
                                var boundingBox = this.dependencyNetworkInstance.getBoundingBox(node.id);

                                let x = boundingBox.right;
                                let y = nodePosition.y;

                                ctx.strokeStyle = "#294475";
                                ctx.lineWidth = 2;
                                ctx.fillStyle = "#A6D5F7";

                                ctx.beginPath();
                                ctx.fillRect(x + 10 - 2.5, y - 15, 145, 25);
                                ctx.closePath();

                                ctx.fill();
                                ctx.stroke();

                                ctx.drawImage(this.graphImages.successImage, x + 10, y - 10, 15, 15);

                                ctx.drawImage(this.graphImages.errorImage, x + 45, y - 10, 15, 15);

                                ctx.drawImage(this.graphImages.inProgressImage, x + 80, y - 10, 15, 15);

                                ctx.drawImage(this.graphImages.waitingImage, x + 115, y - 10, 15, 15);

                                ctx.font = "12px Arial";
                                ctx.fillStyle = "#000000";
                                ctx.textAlign = "center";
                                ctx.textBaseline = "middle";
                                ctx.fillText(node.counters.success + "", x + 35, y - 2.5);
                                ctx.fillText(node.counters.error + "", x + 70, y - 2.5);
                                ctx.fillText(node.counters.inProgress + "", x + 105, y - 2.5);
                                ctx.fillText(node.counters.waiting + "", x + 140, y - 2.5);


                            });
                        });

                        //On click
                        this.dependencyNetworkInstance.on('click', (properties) => {
                            if (properties.nodes && properties.nodes.length) {
                                const id = properties.nodes[0];
                                const node = this.dependencyGraphNodes.get(id)
                                this.filteredExecutionScript = this.executionScript.filter(script => node['label'] == script.action)
                            } else {
                                this.filteredExecutionScript = [];
                            }
                        });

                    })
            });

    }
    
    getLocalTime(time: string) {
        var d = new Date(0);
        d.setUTCSeconds(parseInt(time));
        return d.toLocaleTimeString('en-US', {
            hour12: false,
        });
    }

    updateGraphStats() {
        const actionStats = {}
        for (const script of this.executionScript) {
            if (!actionStats[script.action]) {
                actionStats[script.action] = { success: 0, error: 0, inProgress: 0 }
            }
            if (script.status === "0") {
                actionStats[script.action].success += 1;
            } else {
                if (script.error) {
                    actionStats[script.action].error += 1;
                } else if(script.time){
                    actionStats[script.action].inProgress += 1
                }
            }
        }
        this.dependencyGraphNodes.forEach((node) => {
            const stats = actionStats[node.label] || { success: 0, error: 0, inProgress: 0 };
            const waiting = node.totalNode - stats.success - stats.error - stats.inProgress;
            stats.waiting = waiting;
            this.dependencyGraphNodes.update({ id: node.id, counters: stats })
        })
        this.dependencyNetworkInstance.fit();

    }
}
