import { ErrorHandler } from '@angular/core';
import { LogService, LogHeader } from './experiment/hlbparser/common/logging-service';

export class ErrorInterceptor extends LogService implements ErrorHandler {

  handleError(error) {
    this.error(LogHeader.ERROR, error.stack);
  }
}