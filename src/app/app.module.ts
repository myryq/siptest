import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {FormsModule} from '@angular/forms';
import {SipjsComponent} from './sipjs/sipjs.component';
import {Sipjs2Component} from './sipjs2/sipjs2.component';

@NgModule({
  declarations: [
    AppComponent,
    SipjsComponent,
    Sipjs2Component
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
