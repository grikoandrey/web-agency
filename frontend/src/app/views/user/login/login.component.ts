import {Component, OnInit} from '@angular/core';
import {FormBuilder, Validators} from "@angular/forms";
import {AuthService} from "../../../core/auth.service";
import {LoginResponseType} from "../../../../types/logint-response.type";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {HttpErrorResponse} from "@angular/common/http";
import {Router} from "@angular/router";
import {MatSnackBar} from "@angular/material/snack-bar";
import {UserService} from "../../../shared/services/user.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  showPassword: boolean = false;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [false],
  })

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private _snackBar: MatSnackBar,
    private router: Router,
    private userService: UserService,
  ) {
  }

  ngOnInit(): void {
  }

  login(): void {
    if (this.loginForm.valid && this.loginForm.value.email && this.loginForm.value.password) {
      this.authService.login(this.loginForm.value.email, this.loginForm.value.password,
        !!this.loginForm.value.rememberMe)
        .subscribe({
          next: (data: LoginResponseType | DefaultResponseType) => {
            let error = null;
            if ((data as DefaultResponseType).error !== undefined) {
              error = (data as DefaultResponseType).message;
            }

            const loginResponse: LoginResponseType = data as LoginResponseType;
            if (!loginResponse.accessToken || !loginResponse.refreshToken || !loginResponse.userId) {
              error = 'Ошибка авторизации';
            }
            if (error) {
              this._snackBar.open(error);
              this.loginForm.reset();
              throw new Error(error);
            }
            this.authService.setTokens(loginResponse.accessToken, loginResponse.refreshToken);
            this.authService.userId = loginResponse.userId;

            // 👇 получаем информацию о пользователе
            this.userService.getUserInfo().subscribe({
              next: (userInfo) => {
                if ('error' in userInfo) {
                  this._snackBar.open(userInfo.message || 'Ошибка при получении данных пользователя');
                  this.loginForm.reset();
                  return;
                }

                // 👇 сохраним имя пользователя где-то, например, в AuthService
                this.userService.setUser(userInfo);

                this._snackBar.open('Успешная авторизация!');
                this.router.navigate(['/']);
              },
              error: () => {
                this.loginForm.reset();
                this._snackBar.open('Ошибка при получении данных пользователя');
              }
            });
          },
          error: (error: HttpErrorResponse) => {
            if (error.error && error.error.message) {
              this.loginForm.reset();
              this._snackBar.open(error.error.message);
            } else {
              this.loginForm.reset();
              this._snackBar.open('Ошибка авторизации');
            }
          }
        });
    }
  };

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  };
}
