import * as Quill from "quill";
import { Observable, BehaviorSubject } from "rxjs";
//var Keyboard = Quill.import('modules/keyboard'); 
export interface QuillInstance {
  on: any;
  keyboard:any;
  getText: any;
  getSelection: any;
  setText: any;
  insertText: any;
  hasFocus:any;deleteText:any;
  setSelection:any;
}

export default class EditorService {
 
  private textData = new BehaviorSubject<any>("");
  private onBlur=new BehaviorSubject<any>(false);
  private isEnterPress=new BehaviorSubject<any>(false);
  private isTabPress=new BehaviorSubject<any>(false);
  private onBlurFlag=false;
  private currentword=new BehaviorSubject<any>('');
  private currentsentence=new BehaviorSubject<any>(null);
  private isTextChange:boolean=false;
  getUpdatedValue(): Observable<any> {
    return this.textData.asObservable();
  }

  getCurrentWord(): Observable<any> {
    return this.currentword.asObservable();
  }

  getSuggestionData(): Observable<any> {
    return this.currentsentence.asObservable();
  }
  isEnterPressed(): Observable<any> {
    return this.isEnterPress.asObservable();
  }
  isTabPressed(): Observable<any> {
    return this.isTabPress.asObservable();
  }
  setUpdatedValue(Data: String) {
    this.textData.next(Data);
  }
  quill: QuillInstance;
  index: number = 0;
  range;
  any;
  constructor(quill) {
    this.quill = quill;
    var instance = this;
    this.quill.on("selection-change", function(range, oldRange, source) {
      if (range) {
        instance.index = range.index;
        instance.range = range.length;
        if(instance.onBlurFlag){
        instance.onBlur.next(false);
        instance.onBlurFlag  =false;
      }
      }else{
        instance.onBlurFlag  =true;
        instance.onBlur.next(true);
      }
    });
    this.quill.on("text-change", function(delta, oldDelta, source) {
       //console.log(delta);
       var position =0;
       var tabFlag=false;
       var delFlag=false;
       instance.isTextChange=true;
        if(delta.ops!=undefined){
          delta.ops.forEach(element => {
            if(element.retain!=undefined)
              position = element.retain;
            if(element.insert!=undefined){
              position+=element.insert.length;
              if(element.insert == '\n')
                  instance.pressedEntered();
              if(element.insert == '\t')
                tabFlag=true;  
            }
            if(element.delete!=undefined)
            delFlag =true;
          });
        }
      
        var index = instance.quill.getText().length-1;
        var text = instance.quill.getText().substr(0,index);
        instance.index = position;
        //console.log("value of index inside:"+instance.index);
     
        if(!tabFlag){
        instance.currentSentence( text,position);
        instance.currentWord(text,position);
        }else{
          if(!delFlag)
      setTimeout(function(){ instance.pressedTab(); }, 50); 
        }
    });
  }
  currentWord(text,position){
   var word = this.getWordAt(text,position);
   
     this.currentword.next(word);
   
  }

   currentSentence(text,position){
   var sentence = this.getSentenceTill(text,position);
   var remainingSentences = this.getRemainingSentences(text,position);
   ////console.log(remainingSentences);
   var obj ={
     currentSentence:sentence,
     remainingSentences:remainingSentences
   }

     this.currentsentence.next(obj);
   
  }
  getRemainingSentences (str, pos){

    str = String(str);
    pos = Number(pos) >>> 0;
    var left= str.slice(0, pos).search(/\n.*$/);
    var list = [];
    var temp;
    ////console.log(left);
    if(left>0){
      temp = str.slice(0, left).split("\n");
      temp.forEach(element => {
          if(element.trim()!='')
              list.push(element);
      });
    }


    temp= str.slice(left+1).split("\n");
    temp.splice(0,1);
   
    temp.forEach(element => {
      if(element.trim()!='')
          list.push(element);
  });
  return list;
  }

  getWordAt (str, pos) {

    str = String(str);
    pos = Number(pos) >>> 0; 
    var left = str.slice(0, pos).search(/\S+$/),
        right = str.slice(pos).search(/\s/);
       
    if (right < 0) {
        return str.slice(left);
    }
    return str.slice(left, right + pos);

}

getSentenceTill (str, pos) {

  str = String(str);
  pos = Number(pos) >>> 0;
 
  var t = str.slice(0, pos).search(/\n.*$/);
  
  var right = str.slice(pos).search(/\s/);
    
      if (right < 0) {
        return str.slice(t+1);
    }
   
      return str.slice(t+1,right+ pos);
  

}
getSentenceAt (str, pos) {

  str = String(str);
  pos = Number(pos) >>> 0;
  var left= str.slice(0, pos).search(/\n.+$/);
  return str.slice(left+1).split("\n")[0];
  
}
  isTextChanged():boolean{
    var flag = this.isTextChange;
    this.resetTextChangeFlag();
    return flag;
  }
  resetTextChangeFlag(){
    this.isTextChange = false;
  }
  pressedEntered(){
      this.isEnterPress.next(true);
  }
  pressedTab() {
    this.isTabPress.next(true);
  }
  insertValue(text: String,flag:boolean=true,word) {

    if (word.trim()==''){
      //console.log("inside trim");
      
     
      if(flag){
        this.index--;
      this.quill.deleteText(this.index,1);
      }
      //console.log("::"+text);
     this.quill.insertText(this.index, text+" ");
    
    
     //console.log("value of index before:"+this.index);

    }else
    this.replaceText(this.quill.getText(),text,word,flag);

  }

  replaceText(str,text,word,flag){
    str = String(str);
    var pos ;
    if (flag)
    pos = Number(this.index-1) >>> 0; 
    else
    pos = Number(this.index) >>> 0; 
    var left = str.slice(0, pos).search(/\S+$/);
    if (flag)
    this.quill.deleteText(left,word.length+1);
    else
    this.quill.deleteText(left,word.length);

    let t: string = this.quill.insertText(left, text + " ");
    //console.log("h");
    this.index = left+text.length+1;
  }

  getText(): String {
    return this.quill.getText();
  }

  clear() {
    this.quill.setText("");
  }
  isBlur():Observable<any>{
    return this.onBlur.asObservable();
  }
}
