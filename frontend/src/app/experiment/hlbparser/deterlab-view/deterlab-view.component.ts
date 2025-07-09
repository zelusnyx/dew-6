import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {HttpService} from 'src/app/http-service.service';
import {Router} from '@angular/router';
import {HttpParams} from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RunInfoComponent } from './run-info/run-info.component';
import { CurrentInfoComponent } from './current-info/current-info.component';
declare let $:any;

@Component({
    selector: 'app-deterlab',
    templateUrl: './deterlab-view.component.html',
    styleUrls: ['./deterlab-view.component.scss']
})

export class DeterLabViewComponent implements OnInit {
    @ViewChild(RunInfoComponent, { static: false }) runInfoComponent: RunInfoComponent;
    @ViewChild(CurrentInfoComponent, { static: false }) currentInfoComponent: CurrentInfoComponent;
    userId;
    userNameObj = {username: '', created_date: '', id: null};
    showWarning = false;
    showLinkWindow = false;
    showCreateWindow = false;
    projName = '';
    expName = '';
    projectName = '';
    experimentName = '';
    isValidProjName = false;
    isValidExpName = false;
    experimentId;
    showSwap = false;
    isInTransition = false;
    transitionInterval = null;
    experimentStatus = '';
    // experimentName = '';
    alertType = '';
    showAlert = false;
    alertMsg = '';
    statusMessages = [];
    activityMessages = [];
    activateSwapIn = false;
    deactivateSwapOut = false;
    runStatus = null;
    userCreatedDate;
    userNamesList = [];
    showLoader = false;
    modalMsg = '';
    modalFor = '';
    logList = [];
    constructor(private http: HttpService,
                private route: Router
        , private _snackBar: MatSnackBar,
                public dialog: MatDialog) {
    }
    activeTab = 'run_logs';
    doRefresh = true

    ngOnInit() {
        const url = this.route.url.split('/');
        if (!parseInt(url[url.length - 1], 10)) {
            this.showWarning = true;
            return;
        }
        this.experimentId = url[url.length - 1];
        this.showLoader = true;
        this.http.get('v1/pr/profile/accounts/deterLab/get', {withCredentials: true}).subscribe(data => {
            if (data.length > 0) {
                this.userNamesList = data;
                this.userId = data[0].id.toString();
                this.userNameObj = data[0];
            } else {
                this.showWarning = true;
                return;
            }
            let params = new HttpParams().append('eid', this.experimentId);
            params = params.append('account_id', this.userId);
            this.getProjectMapping(params);
            this.getExperimentStatus(params);
            this.getExperimentActivity(params);
        });
        this.projName = '';
        this.expName = '';
    }

    getRefreshedStatus() {
        this.showLoader = true;
        let params = new HttpParams().append('eid', this.experimentId);
        params = params.append('account_id', this.userId);
        this.getExperimentStatus(params);
        this.getExperimentActivity(params);
        this.runInfoComponent.ngOnInit();
        this.currentInfoComponent.ngOnInit();
    }

    getProjectMapping(params) {
        this.http.get('v1/pr/deter/project', {params, withCredentials: true})
            .subscribe(data1 => {
                this.showSwap = data1.error === undefined;
                if (!data1.error) {
                    this.projectName = data1.project_name;
                    this.experimentName = data1.experiment_name;
                } else {
                    this.projectName = '';
                    this.experimentName = '';
                }
            });
    }

    getExperimentStatus(params) {
        this.showLoader = true;
        this.http.get('v1/pr/deter/project/getstatus', {params, withCredentials: true})
            .subscribe(data2 => {
                this.showLoader = false;
                if (data2.error) {
                    if(this.transitionInterval){
                        clearInterval(this.transitionInterval);
                        this.transitionInterval = null;
                    }
                    this.showSwap = false;
                    this.statusMessages = [data2.error];
                } else if (data2.content === 'No information available.') {
                    this.experimentStatus = 'In transition';
                    this.statusMessages = [];
                    this.activityMessages = [];
                    this.activateSwapIn = false;
                    this.deactivateSwapOut = false;
                    this.isInTransition = true;
                    if(!this.transitionInterval){
                        this.transitionInterval = setInterval(() => {
                            this.getExperimentStatus(params);
                            this.getExperimentActivity(params);
                        },15000)
                    }
                } else {
                    if(this.transitionInterval){
                        clearInterval(this.transitionInterval);
                        this.transitionInterval = null;
                    }
                    this.isInTransition = false;
                    this.statusMessages = data2.content.split('\n');
                    this.experimentStatus = this.statusMessages[1].replace(' ', '').split(':')[1].trim();
                    if (this.experimentStatus === 'active') {
                        this.activateSwapIn = false;
                        this.deactivateSwapOut = false;
                        this.getRunStatus();
                    } else {
                        this.activateSwapIn = true;
                    }
                }
            });
    }

    getExperimentActivity(params) {
        this.http.get('v1/pr/deter/project/getactivity', {params, withCredentials: true})
            .subscribe(data3 => {
                if (data3.content) {
                    this.activityMessages = data3.content.split('\n');
                } else if (data3.error) {
                    this.activityMessages = [data3.error];
                }
                this.showLoader = false;
            });
    }

    enableTheLinkWindow() {
        this.showLinkWindow = true;
        this.showCreateWindow = false;
        this.isValidProjName = false;
        this.projName = '';
        this.expName = '';
    }

    enableTheCreateWindow() {
        this.showCreateWindow = true;
        this.showLinkWindow = false;
        this.isValidProjName = false;
        this.projName = '';
        this.expName = '';
    }

    testProjectValidity() {
        this.http.post('/api/v1/pr/deterlab/project/exists',
            {projectName: this.projName, account_id: this.userId},
            {withCredentials: true}).subscribe(data => {
            this.isValidProjName = data.isExists;
        });
    }

    testExperimentValidity() {
        this.http.post('/api/v1/pr/deterlab/experiment/exists',
            {projectName: this.projName, experimentName: this.expName, account_id: this.userId},
            {withCredentials: true}).subscribe(data => {
            this.isValidExpName = data.isExists;
        });
    }

    createOrLinkToNewExperiment(link: boolean) {
        if (link) {
            this.http.post('/api/v1/pr/deterlab/experiment/exists',
                { projectName: this.projName, experimentName: this.expName, account_id: this.userId },
                { withCredentials: true }).subscribe(data => {
                    if (!data.isExists) {
                        var flag = confirm("Experiment doesn't exist. Do you want to create a new experiment with this name?");
                        if (!flag)
                            return
                    }

                    this.http.post('/api/v1/pr/deter/add/project/mapping',
                        {
                            projectName: this.projName, experimentName: this.expName,
                            experimentId: this.experimentId, account_id: this.userId
                        },
                        { withCredentials: true }).subscribe(data => {
                            console.log(data);
                            if (data === 'Successful') {
                                this.alertMsg = this.showLinkWindow ? 'Successfully linked to experiment' :
                                    'Successfully created new experiment';
                                this.alertType = 'alert-success';
                                this.showAlert = true;
                                setTimeout(() => {
                                    this.showAlert = false;
                                    this.showLinkWindow = false;
                                    this.showCreateWindow = false;
                                    this.ngOnInit();
                                }, 3000);
                            }
                        });


                });
        } else {
            this.http.post('/api/v1/pr/deter/add/project/mapping',
                {
                    projectName: this.projName, experimentName: this.expName,
                    experimentId: this.experimentId, account_id: this.userId
                },
                { withCredentials: true }).subscribe(data => {
                    console.log(data);
                    if (data === 'Successful') {
                        this.alertMsg = 'Successfully created new experiment';
                        this.alertType = 'alert-success';
                        this.showAlert = true;
                        setTimeout(() => {
                            this.showAlert = false;
                            this.showLinkWindow = false;
                            this.showCreateWindow = false;
                            this.ngOnInit();
                        }, 3000);
                    }
                });
        }


    }

    swapInOrSwapOutExperiment(type) {
        let params = new HttpParams().append('eid', this.experimentId);
        params = params.append('mode', type);
        params = params.append('account_id', this.userId);
        this.http.get('v1/pr/deter/project/swap', {params, withCredentials: true})
            .subscribe(data => {
                this.showLoader = false;
                if (data) {
                    this.alertMsg = type === 'swapin' ? 'Started swap-in experiment' :
                        'Successfully swapped-out experiment';
                    this.alertType = 'alert-success';
                    this.showAlert = true;
                    setTimeout(() => {
                        this.showAlert = false;
                        this.ngOnInit();
                    }, 3000);
                }
            });
    }

    updateNSFile() {
        let params = new HttpParams().append('eid', this.experimentId);
        params = params.append('account_id', this.userId);
        this.http.get('v1/pr/deter/update/project/nsfile', {params, withCredentials: true})
            .subscribe(data => {
                this.showLoader = false;
                if (data.success) {
                    this.alertMsg = 'Successfully updated NS file';
                    this.alertType = 'alert-success';
                    this.showAlert = true;
                    setTimeout(() => {
                        this.showAlert = false;
                    }, 3000);
                }
            });
    }

    updateMapping() {
        this.showLinkWindow = true;
        this.isValidExpName = true;
        this.isValidProjName = true;
    }

    cancelClicked() {
        this.showLinkWindow = false;
        this.showCreateWindow = false;
    }

    deleteMapping() {
        let params = new HttpParams().append('eid', this.experimentId);
        params = params.append('account_id', this.userId);
        this.http.delete('v1/pr/deter/project/mapping/delete', {params, withCredentials: true})
            .subscribe(data => {
                this.showLoader = false;
                if (data === 'Successful') {
                    this.alertMsg = 'Successfully deleted mapping';
                    this.alertType = 'alert-success';
                    this.showAlert = true;
                    setTimeout(() => {
                        this.showAlert = false;
                        this.showLinkWindow = false;
                        this.showCreateWindow = false;
                        this.projName = '';
                        this.expName = '';
                        this.experimentStatus = '';
                        this.activityMessages = [];
                        this.statusMessages = [];
                        this.ngOnInit();
                    }, 3000);
                }
            });
    }

    activateModal(type) {
        this.modalFor = type;
        switch (this.modalFor) {
            case 'delete':
                this.modalMsg = 'Do you really want to delete the mapping ?';
                break;
            case 'swapin':
                this.modalMsg = 'Do you really want to swap-in the experiment ?';
                break;
            case 'swapout':
                this.modalMsg = 'Do you really want to swap-out the experiment ?';
                break;
            case 'updateNs':
                this.modalMsg = 'Do you really want to update the NS file ?';
                break;
            case 'run':
                this.modalMsg = 'Do you really want to run the experiment ?';
                break;
	    case 'stop':
                this.modalMsg = 'Do you really want to stop the experiment ?';
                break;
            default:
                this.modalMsg = '';
        }
    }

    executeModalAction() {
        this.showLoader = true;
        switch (this.modalFor) {
            case 'delete':
                this.deleteMapping();
                break;
            case 'swapin':
                this.swapInOrSwapOutExperiment('swapin');
                break;
            case 'swapout':
                this.swapInOrSwapOutExperiment('swapout');
                break;
            case 'updateNs':
                this.updateNSFile();
                break;
            case 'run':
                this.run();
                break;
            case 'stop':
                this.stop();
                break;
	    default:
                break;
        }
    }

    closeModal() {
        this.modalFor = '';
    }

    activateOnProjValidity() {
        if (this.projName) {
            return this.isValidProjName ? 'is-valid' : 'is-invalid';
        } else {
            return '';
        }
    }

    activateOnExpCreateValidity() {
        if (this.projName) {
            return this.isValidExpName ? 'is-invalid' : 'is-valid';
        } else {
            return '';
        }
    }

    activateOnExpValidity() {
        if (this.expName) {
            return this.isValidExpName ? 'is-valid' : 'is-invalid';
        } else {
            return '';
        }
    }

    userChanged() {
        this.userId = this.userNameObj.id;
        this.activityMessages = [];
        this.statusMessages = [];
        this.projName = '';
        this.expName = '';
        this.experimentStatus = '';
        let params = new HttpParams().append('eid', this.experimentId);
        params = params.append('account_id', this.userId);
        this.getProjectMapping(params);
        this.getExperimentStatus(params);
        this.getExperimentActivity(params);
    }

    run(data = {label: 'main'}) {
        
        const params = {
            eid: this.experimentId,
            account_id: this.userId,
            data: data
        };

        if(data['label']!=undefined){
        params['label'] = data['label']
        delete data['label']
        }

        this.http.post('/api/v1/pr/deter/project/run', params, {withCredentials: true})

            .subscribe(data1 => {
                this.showLoader = false;

                if (data1.success) {

                    this._snackBar.open('Successfully started', 'close', {
                        duration: 2000,
                    });
                    this.runStatus = 'start';
                } else {
		
	          const dialogRef = this.dialog.open(RunVariablePopUp, {
                     width: '30%',
                     data: data1.labels,
                    });

                    dialogRef.afterClosed().subscribe((result) => {
                        if (result !== undefined) {
                            this.showLoader = true;
                            console.log(result)
                            this.run(result);
                        }
                    });
		}
            }, error => {
                this.showLoader = false;
                this._snackBar.open('Something went wrong please try again later!', 'close', {
                    duration: 2000,
                });
            });
    }





    stop(data = {label: 'main'}) {
        this.doRefresh = false;
       const params = {
            eid: this.experimentId,
            account_id: this.userId,
            data: data
        };

        if(data['label']!=undefined){
        params['label'] = data['label']
        delete data['label']
        }

        this.http.post('/api/v1/pr/deter/project/stop', params, {withCredentials: true})
            .subscribe(data1 => {
                this.showLoader = false;
                if (data1.success) {
                    this._snackBar.open('Successfully stopped', 'close', {
                        duration: 2000,
                    });
                    this.runStatus = 'stop';
                    $('#nav-contact-tab').click();
                    this.updateNavTabStatus('run_logs');
                } else {
                    const dialogRef = this.dialog.open(RunVariablePopUp, {
                        width: '30%',
                        data: data1.labels,
                    });

                    dialogRef.afterClosed().subscribe((result) => {
                        if (result !== undefined) {
                            this.showLoader = true;
                            console.log(result)
                            this.stop(result);
                        }
                    });
                }
                this.doRefresh = true;
            }, error => {
                this.showLoader = false;
                this._snackBar.open('Something went wrong please try again later!', 'close', {
                    duration: 2000,
                });
                this.doRefresh = true;
            });
    }

    getRunStatus() {
        const params = {
            eid: this.experimentId,
            account_id: this.userId,
        };

        this.http.get('v1/pr/deter/project/getRunStatus', { params, withCredentials: true })

            .subscribe(data1 => {
                this.showLoader = false;

                if (data1.success) {
                    this.runStatus = data1.status;
                } else {

                    const dialogRef = this.dialog.open(RunVariablePopUp, {
                        width: '30%',
                        data: data1.labels,
                    });

                    dialogRef.afterClosed().subscribe((result) => {
                        if (result !== undefined) {
                            this.showLoader = true;
                            console.log(result)
                            this.run(result);
                        }
                    });
                }
            }, error => {
                this.showLoader = false;
                this._snackBar.open('Something went wrong please try again later!', 'close', {
                    duration: 2000,
                });
            });
    }



    getRunLogs() {
        
        let url = 'v1/pr/deter/project/run/logs?eid='+this.experimentId+'&account_id='+this.userId;
        this.http.get(url, {withCredentials: true})
            .subscribe(data => {
                console.log(data)
                this.logList = data
            });
    }

    updateNavTabStatus(tab) {
        if (tab == 'current') {
            if (this.activeTab != 'current') {
                console.log('show');
                this.currentInfoComponent.onSelectionChange(true);
            }
        } else {
            if (this.activeTab == 'current') {
                console.log('hide')
                this.currentInfoComponent.onSelectionChange(false);
            }
        }
        this.activeTab = tab;
    }
}

@Component({
    selector: 'run-variable-popup',
    templateUrl: 'run-variable-popup.component.html',
    styleUrls: ['./deterlab-view.component.scss'],
})
export class RunVariablePopUp implements OnInit {
    variableList: any
    variable:any
    selectedLabelIndex = ''

    constructor(
        public dialogRef: MatDialogRef<RunVariablePopUp>,
        @Inject(MAT_DIALOG_DATA) public labels: any
    ) {
    }
    ngOnInit(): void {
        this.selectedLabelIndex = ''
    }

    onSelectChange() {
        this.variableList = {};
        this.variable = []
        console.log(this.selectedLabelIndex)
        if(this.selectedLabelIndex!='' && this.selectedLabelIndex!=undefined && this.selectedLabelIndex!=null){
        this.variableList['label'] = this.labels[this.selectedLabelIndex].label
        this.labels[this.selectedLabelIndex].variable.forEach(element => {
            this.variableList[element.variable] = '';
            this.variable.push(element)
        });
    }
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}

