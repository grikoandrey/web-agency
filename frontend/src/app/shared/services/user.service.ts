import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {DefaultResponseType} from "../../../types/default-response.type";
import {environment} from "../../../environments/environment";
import {UserInfoType} from "../../../types/user-info.type";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private _user: UserInfoType | null = null;

  constructor(
    private http: HttpClient,
  ) { }

  getUserInfo(): Observable<UserInfoType | DefaultResponseType> {
    return this.http.get<UserInfoType | DefaultResponseType>(`${environment.apiUrl}users`);
  };

  setUser(user: UserInfoType): void {
    this._user = user;
  }

  get user(): UserInfoType | null {
    return this._user;
  }
}
