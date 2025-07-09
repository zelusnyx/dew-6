
import { NgModule } from "@angular/core";
import { HeaderComponent } from './header/header.component';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from './layout/layout.component';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { FixedLayoutComponent } from './fixedLayout/layout.component';

const COMPONENTS = [
    HeaderComponent,
    LayoutComponent,
    FixedLayoutComponent
  ];

@NgModule({
  declarations: [
    ...COMPONENTS
  ],
  imports: [
   CommonModule,
   MatMenuModule,
   MatButtonModule,
   FormsModule
  ], exports: [CommonModule, ...COMPONENTS]
})
export class CoreModule {}
