import {Component, Inject, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {HttpService} from 'src/app/http-service.service';
import {Router} from '@angular/router';
import {HttpParams} from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'run-info',
    templateUrl: './run-info.component.html',
    styleUrls: ['./run-info.component.scss']
})

export class RunInfoComponent implements OnInit, OnChanges {
    @Input() experiment_id:Number
    @Input() account_id:Number
    @Input() run_status:string
    @Input() doRefresh: boolean
    logList = []
    error:String
    errorFlag:boolean = false
    logid:String
    executionScript = []
    runScript = ""
    loader = false
    refreshIntervalId = null
    constructor(private http:HttpService
        , private _snackBar: MatSnackBar
    
        ){}
    ngOnChanges(changes: SimpleChanges): void {
        if(changes.account_id !== undefined){
            this.account_id = changes.account_id.currentValue
        } 

        if(changes.experiment_id !== undefined){
            this.experiment_id = changes.experiment_id.currentValue
        } 
        this.ngOnInit()
    }
    ngOnInit(): void {
        this.logList = []
        this.executionScript = []
        console.log("inside Run Info Component"+this.experiment_id+":"+this.account_id)

        if(this.experiment_id!=undefined && this.account_id !=undefined)
        this.getRunLogs()
    }

    getRunLogs() {
        this.logList = []
        this.errorFlag = false
        let url = 'v1/pr/deter/project/run/logs?eid='+this.experiment_id+'&account_id='+this.account_id;
        this.http.get(url, {withCredentials: true})
            .subscribe(data => {
                if(data.logs!=undefined && data.logs.length!=0){
                this.logList = data.logs.reverse().map(obj => {
                    obj.started_at = (new Date(obj.started_at)).toString();
                    return obj;
                })
                this.logid = data.logs[0].id
                this.onLogsSelectionChange();
                } else{
                this.error = data.error
                this.errorFlag = true
                }
            });
    }

    onLogsSelectionChange() {
        if(!this.logid){
            return;
        }
        if(this.refreshIntervalId){
            clearInterval(this.refreshIntervalId);
        }
        this.showDetails();
        //Get the run script
        this.http.post('/api/v1/pr/deter/project/run/script', {
            rid: this.logid,
            account_id: this.account_id,
            eid: this.experiment_id,
            rsid: this.logid
        }, {withCredentials: true})
            .subscribe(data1 => {
                if (data1.error==undefined)
                this.runScript = data1.data ? data1.data.replaceAll("\n", "<br>") : "";
                else{
                    this.runScript = "";
                    console.log(data1.error)
                this._snackBar.open(data1.error, 'close', {
                    duration: 2000,
                });
                }
            }, error => {
                this.runScript = "";
                this._snackBar.open('Something went wrong please try again later!', 'close', {
                    duration: 2000,
                });
            });
        //Check if log is in running state, if so refresh every 5 seconds
        if(this.run_status == 'start'){
            if(this.logid == this.logList[0].id) {
                this.refreshIntervalId = setInterval(() => {
                    if(this.doRefresh){
                        this.showDetails();
                    }
                }, 30000)
            }
        }
    }

    getLocalTime(time: string) {
        var d = new Date(0);
        d.setUTCSeconds(parseInt(time));
        return d.toLocaleTimeString('en-US', {
            hour12: false,
        });
    }

    

    showDetails(){
        console.log(this.logid)
        this.errorFlag = false
        this.loader = true
        let params = {
            rid:this.logid,
            account_id:this.account_id,
            eid: this.experiment_id,
            b:20,
        }
        if(this.run_status == "start"){
            if(this.logList && this.logList.length && this.logid != this.logList[0]['id']){
                params['rsid'] = this.logid;
            }
        }else{
            params['rsid'] = this.logid
        }
        this.http.post('/api/v1/pr/deter/project/run/get', params, {withCredentials: true})
            .subscribe(data1 => {
                this.loader = false
                if (data1.error==undefined)
                this.executionScript = data1.data
                else{
                    this.executionScript = []
                    console.log(data1.error)
                this._snackBar.open(data1.error, 'close', {
                    duration: 2000,
                });
                }
            }, error => {
                this.executionScript = []
                this.loader = false
                this._snackBar.open('Something went wrong please try again later!', 'close', {
                    duration: 2000,
                });
            });
    }
}
