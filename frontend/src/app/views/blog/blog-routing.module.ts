import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {ListComponent} from "./list/list.component";
import {ArticleComponent} from "./article/article.component";

const routes: Routes = [
  {path: 'articles', component: ListComponent},
  {path: 'articles/:url', component: ArticleComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BlogRoutingModule { }
