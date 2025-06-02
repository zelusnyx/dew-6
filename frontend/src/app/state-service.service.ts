import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable()
export class StateService {
  experimentColors: BehaviorSubject<any> = new BehaviorSubject({});
  loaderSwitch: BehaviorSubject<boolean> = new BehaviorSubject(false);
  actors: BehaviorSubject<any> = new BehaviorSubject(null);
  behavior: BehaviorSubject<any> = new BehaviorSubject(null);
  constraints: BehaviorSubject<any> = new BehaviorSubject(null);
  bindings: BehaviorSubject<any> = new BehaviorSubject(null);
  experimentId: BehaviorSubject<Number>= new BehaviorSubject(0);
  experimentName: BehaviorSubject<String> = new BehaviorSubject("");
  experimentDescription: BehaviorSubject<String> = new BehaviorSubject("");
  driveId: BehaviorSubject<String> = new BehaviorSubject("");
  tokenList: BehaviorSubject<any> = new BehaviorSubject("");
  experimentControl: BehaviorSubject<number> = new BehaviorSubject(4);
  saveEvent: BehaviorSubject<boolean> = new BehaviorSubject(false);
  userDetails: any;
  currentBehaviorWord: String;
  currentConstraintWord: String;
  tokenLevel: String;
  serverData: BehaviorSubject<any> = new BehaviorSubject(null);
  slideTobeShown: BehaviorSubject<any> = new BehaviorSubject({});
  lastSlideSeqNum: BehaviorSubject<number> = new BehaviorSubject(0);
  allAnyPresent = false;
  currentViewId: BehaviorSubject<number>=new BehaviorSubject(1);
  isUpload: BehaviorSubject<Boolean> = new BehaviorSubject(false);

  setAllAnyPresentFlag(val) {
    this.allAnyPresent = val;
  }

  getAllAnyPresentFlag() {
    return this.allAnyPresent;
  }

  triggerSaveEvent() {
    this.saveEvent.next(true);
  }

  monitorSaveEvent() : Observable<boolean> {
    return this.saveEvent.asObservable();
  }
  
  setLocalServerData(serverData: {}) {
    this.serverData.next(serverData);
  }
  getLocalServerData(): Observable<any> {
    return this.serverData.asObservable();
   }
  setExperimentControl(code: number) {
    this.experimentControl.next(code);
  }
  getExperimentControl() {
   return this.experimentControl.asObservable();
  }
  getTokenLevel():String {return this.tokenLevel;}
  setTokenLevel(tokenLevel) {this.tokenLevel=tokenLevel;}
  setTokenList(data: any) {
    this.tokenList.next(data);
  }
  getTokenList():Observable<any> {
    return this.tokenList.asObservable();
  }
  enableLoader(): void {
    this.loaderSwitch.next(true);
  }
  disableLoader(): void {
    this.loaderSwitch.next(false);
  }
  isLoaderEnabled(): Observable<boolean> {
    return this.loaderSwitch.asObservable();
  }

  getExperimentName(): Observable<any> {
    return this.experimentName.asObservable();
  }

  getExperimentColors(): Observable<any> {
    return this.experimentColors.asObservable();
  }

  getDriveId(): Observable<any> {
    return this.driveId.asObservable();
  }

  getExperimentDescription(): Observable<any> {
    return this.experimentDescription.asObservable();
  }
  getUserDetails(): any {
    return this.userDetails;
  }
  setUserDetails(user) {
    this.userDetails = user;
  }
  getBindings(): Observable<any> {
    return this.bindings.asObservable();
  }
  getActors(): Observable<any> {
    return this.actors.asObservable();
  }
  setCurrentBehaviorWord(word: any) {
    this.currentBehaviorWord = word;
  }
  getCurrentBehaviorWord(): String {
    return this.currentBehaviorWord;
  }
  setCurrentConstraintWord(word: any) {
    this.currentConstraintWord = word;
  }
  getCurrentConstraintWord(): String {
    return this.currentConstraintWord;
  }
  getBehavior(): Observable<any> {
    return this.behavior.asObservable();
  }
  getConstraints(): Observable<any> {
    return this.constraints.asObservable();
  }
  setBindings(Bindings: any) {
    this.bindings.next(Bindings);
  }
  setActors(data: any) {
    this.actors.next(data);
  }
  setBehavior(data: any) {
    this.behavior.next(data);
  }
  setConstraints(data: any) {
    this.constraints.next(data);
  }
  setExperimentName(data: String) {
    this.experimentName.next(data);
  }
  setDriveId(data: String) {
    this.driveId.next(data);
  }

  setExperimentColors(data: any){
    this.experimentColors.next(data);
  }

  setUpload(val: Boolean) {
    this.isUpload.next(val);
  }

  getUpload(): Observable<Boolean> {
    return this.isUpload.asObservable();
  }

  setExperimentDescription(data: String) {
    this.experimentDescription.next(data);
  }

  getExperimentId(): Observable<any> {
    return this.experimentId.asObservable();
  }

  setExperimentId(newId: Number) {
    this.experimentId.next(newId);
  }

  getslideTobeShown(): Observable<any> {
    return this.slideTobeShown.asObservable();
  }

  setslideTobeShown(slide: any){
    this.slideTobeShown.next(slide);
  }

  getCurrentViewId(): Observable<any> {
    return this.currentViewId.asObservable();
  }

  setCurrentViewId(viewId: number){
    this.currentViewId.next(viewId)
  }

  getlastSlideSeqNum(): Observable<any>{
    return this.lastSlideSeqNum;
  }

  setlastSlideSeqNum(snum: number){
    this.lastSlideSeqNum.next(snum);
  }
}
