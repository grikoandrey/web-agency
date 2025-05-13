import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {catchError, Observable, switchMap, throwError} from "rxjs";
import {Injectable} from "@angular/core";
import {AuthService} from "./auth.service";
import {Router} from "@angular/router";
// import {LoaderService} from "../../shared/services/loader.service";
import {DefaultResponseType} from "../../types/default-response.type";
import {LoginResponseType} from "../../types/logint-response.type";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService,
              // private loaderService: LoaderService,
              private router: Router,) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // this.loaderService.showLoader();

    const tokens = this.authService.getTokens();
    if (tokens && tokens.accessToken) {
      const authReq = req.clone({
        headers: req.headers.set('x-auth', tokens.accessToken)
      });
      return next.handle(authReq)
        .pipe(
          catchError((error) => {
            if (error.status === 401 && !authReq.url.includes('/login') && !authReq.url.includes('/refresh')) {
              return this.handle401Error(authReq, next);
            }
            return throwError(() => error);
          }),
          // finalize(() => this.loaderService.hideLoader())
        );
    }
    return next.handle(req)
      // .pipe(finalize(() => this.loaderService.hideLoader()));
  };

  handle401Error(req: HttpRequest<any>, next: HttpHandler) {
    return this.authService.refreshToken()
      .pipe(
        switchMap((result: DefaultResponseType | LoginResponseType) => {
          let error: string = '';
          if ((result as DefaultResponseType).error !== undefined) {
            error = (result as DefaultResponseType).message;
          }
          const refreshResult: LoginResponseType = result as LoginResponseType;
          if (!refreshResult.accessToken || !refreshResult.refreshToken || !refreshResult.userId) {
            error = 'Ошибка авторизации!';
          }
          if (error) {
            return throwError(() => new Error(error));
          }
          this.authService.setTokens(refreshResult.accessToken, refreshResult.refreshToken);

          const authReq = req.clone({
            headers: req.headers.set('x-auth', refreshResult.accessToken)
          });
          return next.handle(authReq);
        }),
        catchError(error => {
          this.authService.removeTokens();
          this.router.navigate(['/']);
          return throwError(() => error);
        })
      )
  }
}
