import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/http-service.service';
import { AuthService } from 'src/app/@auth/auth.service';
import { data } from 'vis-network';

@Injectable()

export class LogService {
    level: LogLevel = LogLevel.All;
    logWithDate: boolean = true;

    constructor(private http: HttpService, private authService: AuthService) {}

    debug(msg: string, ...optionalParams: any[]) {
        this.writeToLog(msg, LogLevel.Debug, optionalParams);
    }
    
    info(msg: string, ...optionalParams: any[]) {
        this.writeToLog(msg, LogLevel.Info, optionalParams);
    }
    
    warn(msg: string, ...optionalParams: any[]) {
        this.writeToLog(msg, LogLevel.Warn, optionalParams);
    }
    
    error(header: any, msg: any) {
        console.error(msg);
        this.writeToLog(msg, LogLevel.Error, header);
    }
    
    fatal(msg: string, ...optionalParams: any[]) {
        this.writeToLog(msg, LogLevel.Fatal, optionalParams);
    }
    
    log(header: any, msg: any) {
        console.log(msg);
        this.writeToLog(msg.toString(), LogLevel.All, header);
    }

    private writeToLog(msg: string, level: LogLevel, header) {
        if (this.shouldLog(level)) {
            let entry: LogEntry = new LogEntry();
            entry.message = msg;
            entry.level = level;
            entry.logWithDate = this.logWithDate;
            var message = entry.buildLogString(header,msg);
            const data = {
                message: [message]
              };
            this.http
            .put('v1/pr/log/user-logging', data, { withCredential: true })
            .subscribe((receivedData: ParseApiBean) => {
                console.log(receivedData);
            });
        }
    }

    private shouldLog(level: LogLevel): boolean {
        let ret: boolean = false;
        if ((level >= this.level && level !== LogLevel.Off) || this.level === LogLevel.All) {
            ret = true;
        }
        return ret;
    }


}

export enum LogLevel {
    All = 0,
    Debug = 1,
    Info = 2,
    Warn = 3,
    Error = 4,
    Fatal = 5,
    Off = 6
}

export enum LogHeader {
    KEY_PRESS = "KEY_PRESS",
    DATA_RECEIVED = "DATA_RECEIVED",
    DATA_SENT = "DATA_SENT",
    GRAPH_UPDATE = "GRAPH_UPDATE",
    TEXT_UPDATED = "TEXT_UPDATED",
    INFO = "INFO",
    ERROR = "ERROR"
}

export class LogEntry {
    // Public Properties
    entryDate: Date = new Date();
    message: string = "";
    level: LogLevel = LogLevel.Debug;
    extraInfo: any[] = [];
    logWithDate: boolean = true;
    
    buildLogString(header, logData): string {
        let ret: string = "";
        var date = new Date();
        var time = date.toLocaleTimeString();
        var tempTime = time.split(":")
        if (tempTime[0].length==1) {
            tempTime[0] = "0" + tempTime[0];
        } 
        if (tempTime[1].length==1) {
            tempTime[1] = "0" + tempTime[1];
        }
        if (tempTime[2].length==1) {
            tempTime[2] = "0" + tempTime[2];
        }
        time = tempTime.join(":");
        var dateTime = ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '/' + ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate())) + '/' + date.getFullYear() + " " + time;
        if (this.logWithDate) {
            ret = dateTime + " | ";
        }
        ret += "FRONTEND "
        ret += header + ": " + logData;    
        return ret;
    }

    printGraphParameterData(graphItemParametersList, id_of_node, id_of_edge):string {
        let string = ""
        for(var i in id_of_node) {
          string += "Node " + i + ": (";
          var temp = graphItemParametersList[id_of_node[i]];
          for(var j in temp) {
            string += j + " - " + temp[j] + ", ";
          }
          string = string.substring(0, string.length - 2)
          string += "), "
        }
        for(var i in id_of_edge) {
          string += "Edge " + i + ": (";
          var temp = graphItemParametersList[id_of_edge[i]['id']];
          for(var j in temp) {
            string += j + " - " + temp[j] + ", ";
          }
          string = string.substring(0, string.length - 2)
          string += "), "
        }
        string = string.substring(0, string.length - 2)
        return string;
      }
}