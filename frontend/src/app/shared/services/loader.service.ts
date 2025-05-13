import { Injectable } from '@angular/core';
import {Subject} from "rxjs";
import {NgxSpinnerService} from "ngx-spinner";

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  isShowed$ = new Subject<boolean>();

  constructor(private spinner: NgxSpinnerService,) { }

  showLoader() {
    this.isShowed$.next(true);
    this.spinner.show();
  };

  hideLoader() {
    this.isShowed$.next(false);
    this.spinner.hide();
  };
}
