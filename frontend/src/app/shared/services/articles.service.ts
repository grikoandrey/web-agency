import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../../environments/environment";
import {ArticleType} from "../../../types/article.type";
import {ActiveParamsType} from "../../../types/active-params.type";

@Injectable({
  providedIn: 'root'
})
export class ArticlesService {

  constructor(private http: HttpClient) {
  }

  getPopArticles(): Observable<ArticleType[]> {
    return this.http.get<ArticleType[]>(`${environment.apiUrl}articles/top`);
  };

  getArticles(params?: ActiveParamsType): Observable<{ count: number, pages: number, items: ArticleType[] }> {
    return this.http.get<{ count: number, pages: number, items: ArticleType[] }>(
      `${environment.apiUrl}articles`,
      {params: params || {}}  // если params нет — передаём пустой объект
    );
  };

  getArticle(url: string): Observable< ArticleType> {
    return this.http.get<ArticleType>(`${environment.apiUrl}articles/${url}`);
  };

  getRelatedArticles(url: string): Observable< ArticleType[]> {
    return this.http.get<ArticleType[]>(`${environment.apiUrl}articles/related/${url}`);
  };
}
