
import { NgModule, Directive, APP_INITIALIZER } from "@angular/core";
import { PublicRoutingModule } from './public-routing.module';
import { PublicComponent } from './public.component';
import { PublicHLBParserModule } from './hlbparser/hlpparser.module';
import { CommonModule } from '@angular/common';
import { QuillModule } from 'ngx-quill';
import { CoreModule } from '../@core/core.module';
import { AuthModule } from '../@auth/auth.module';

import { PageNotFound } from './error/error.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  exports:[PublicComponent],
  declarations: [
    PublicComponent,
    PageNotFound
  ],
  imports: [
    PublicRoutingModule,
    CommonModule,
    CoreModule,
    PublicHLBParserModule,
    QuillModule.forRoot(),
  ]
})
export class PublicModule {}
