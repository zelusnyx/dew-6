import { Pipe, PipeTransform } from '@angular/core';
import { StateService } from '../../../state-service.service';


@Pipe({
    name: 'textfilter',
    pure: false
})
export class TextFilterPipe implements PipeTransform {

  constructor(private state:StateService){}
  transform(items: any, filter1: any): any {
    var filter = filter1.text;
    var option = filter1.name;
    if (!items || !filter) {
      if(items.length>0){
        if(option == 'behavior')
      this.state.setCurrentBehaviorWord(items[0].value);
      else if(option == 'constraint')
      this.state.setCurrentConstraintWord(items[0].value);
      }else{
        if(option == 'behavior')
      this.state.setCurrentBehaviorWord("");
      else if(option == 'constraint')
      this.state.setCurrentConstraintWord("");
      }
      return items;
    }
    if(filter.trim()===""){

      if(items.length>0){
        if(option == 'behavior')
      this.state.setCurrentBehaviorWord(items[0].value);
      else if(option == 'constraint')
      this.state.setCurrentConstraintWord(items[0].value);

      }else{
        if(option == 'behavior')
      this.state.setCurrentBehaviorWord("");
      else if(option == 'constraint')
      this.state.setCurrentConstraintWord("");
      }
    return items;
  }
    else{
 
   var filterList= items.filter((item: any) => item.value.trim().toLowerCase().indexOf( filter.trim().toLowerCase())> -1);
   if(filterList.length>0){
    if(option == 'behavior')
  this.state.setCurrentBehaviorWord(filterList[0].value);
  else if(option == 'constraint')
  this.state.setCurrentConstraintWord(filterList[0].value);

  }else{
    if(option == 'behavior')
  this.state.setCurrentBehaviorWord("");
  else if(option == 'constraint')
  this.state.setCurrentConstraintWord("");
  }
   return filterList; 
  }
   }
  
}