import { Component, OnInit } from '@angular/core';
import {AuthService} from "../../../core/auth.service";
import {UserInfoType} from "../../../../types/user-info.type";
import {UserService} from "../../services/user.service";
import {Router} from "@angular/router";
import {MatSnackBar} from "@angular/material/snack-bar";
import {DefaultResponseType} from "../../../../types/default-response.type";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  activeFragment = '';

  isLogged: boolean = false;
  user: UserInfoType | null = null;

  constructor(private authService: AuthService,
              private _snackBar: MatSnackBar,
              private router: Router,
              private userService: UserService) {
    this.isLogged = this.authService.getIsLoggedIn();
  }

  ngOnInit(): void {

    this.authService.isLogged$.subscribe((isLoggedIn: boolean) => {
      this.isLogged = isLoggedIn;
    });

    if (this.isLogged && !this.user) {
      this.userService.getUserInfo().subscribe((data: UserInfoType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          const error: string = (data as DefaultResponseType).message;
          throw new Error(error);
        }
        this.user = data as UserInfoType;
        this.userService.setUser(this.user);
      });
    }
    if (!this.user) {
      this.user = null;
    }
  }

  logout(): void {
    this.authService.logout()
      .subscribe({
        next: (): void => {
          this.doLogout();
        },
        error: (): void => {
          this.doLogout();
        }
      })
  };

  doLogout(): void {
    this.authService.removeTokens();
    this.authService.userId = null;
    this._snackBar.open('Успешный выход!');
    this.router.navigate(['/']);
  };
}
