import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../../environments/environment";
import {CommentParamsType} from "../../../types/comments-params.type";
import {CommentType} from "../../../types/comment.type";
import {DefaultResponseType} from "../../../types/default-response.type";
import {CommentsActionType} from "../../../types/comments-action.type";

@Injectable({
  providedIn: 'root'
})
export class CommentsService {

  constructor(private http: HttpClient) {
  }

  getComments(params: CommentParamsType): Observable<{ allCount: number, comments: CommentType[] }> {
    const httpParams = new HttpParams()
      .set('offset', params.offset.toString())
      .set('article', params.article);
    return this.http.get<{ allCount: number, comments: CommentType[] }>(
      `${environment.apiUrl}comments`,
      {params: httpParams}
    );
  };

  giveComment(text: string, article: string): Observable<DefaultResponseType> {
    return this.http.post<DefaultResponseType>(`${environment.apiUrl}comments/`, {text, article});
  };

  actionsComment(action: string, comment: string): Observable<DefaultResponseType> {
    return this.http.post<DefaultResponseType>(`${environment.apiUrl}comments/${comment}/apply-action`, {action});
  };

  getCommentsAction(articleId: string): Observable<CommentsActionType[] | DefaultResponseType> {
    return this.http.get<CommentsActionType[] | DefaultResponseType>(`${environment.apiUrl}comments/article-comment-actions?articleId=${articleId}`);
  }

  getCommentAction(comment: string): Observable<CommentsActionType[] | DefaultResponseType> {
    return this.http.get<CommentsActionType[] | DefaultResponseType>(`${environment.apiUrl}comments/${comment}/actions`);
  }

}
