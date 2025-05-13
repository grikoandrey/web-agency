import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ArticleCardComponent} from './components/article-card/article-card.component';
import {RouterModule} from "@angular/router";
import { LoaderComponent } from './components/loader/loader.component';
import {NgxSpinnerModule} from "ngx-spinner";


@NgModule({
  declarations: [
    ArticleCardComponent,
    LoaderComponent,
  ],
  exports: [
    ArticleCardComponent, LoaderComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    NgxSpinnerModule,
  ]
})
export class SharedModule {
}
