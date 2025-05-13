import {Component, ElementRef, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {OrderType} from "../../../../types/order.type";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Router} from "@angular/router";
import {OrderService} from "../../services/order.service";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {FormBuilder, Validators} from "@angular/forms";
import {UserInfoType} from "../../../../types/user-info.type";
import {AuthService} from "../../../core/auth.service";
import {UserService} from "../../services/user.service";

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  currentYear: number = new Date().getFullYear();

  activeFragment: string = '';

  @ViewChild('footer_popup') popup!: TemplateRef<ElementRef>;

  dialogRef: MatDialogRef<any> | null = null;

  consultForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.pattern(/^[А-ЯA-Z][а-яa-z]+$/)]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
  });

  isSuccess: boolean = false;
  errorMessage: string | null = null;

  constructor(private _snackBar: MatSnackBar,
              private dialog: MatDialog,
              private fb: FormBuilder,
              private router: Router,
              private orderService: OrderService) {
  }

  ngOnInit(): void {
  }

  createConsult(): void {
    this.isSuccess = false;
    this.consultForm.reset();
    this.errorMessage = null;

    this.dialogRef = this.dialog.open(this.popup);
  };


  closePopup(): void {
    this.dialogRef?.close();
    this.isSuccess = false;
    this.consultForm.reset();
    this.errorMessage = null;
  };

  sendOrder(type: string): void {
    if (this.consultForm.invalid) {
      this.consultForm.markAllAsTouched(); // показать ошибки
      return;
    }

    const formData = this.consultForm.value;

    const dataPhone: string = '+7' + (formData.phone ?? '');

    const consultData: OrderType = {
      name: formData.firstName ?? '',
      phone: dataPhone,
      type: type, // передаётся вручную при клике на кнопку
    };

    this.orderService.order(consultData).subscribe({
      next: (data: DefaultResponseType) => {
        if (data.error) {
          this.errorMessage = 'Произошла ошибка при отправке формы, попробуйте еще раз.';
          this._snackBar.open(data.message);
        } else {
          this.isSuccess = true;
          this.errorMessage = null;
        }
      },
      error: (err): void => {
        this.errorMessage = 'Произошла ошибка при отправке формы, попробуйте еще раз.';
        this._snackBar.open(err.error.message);
      }
    });
  };

  orderOk(): void {
    this.closePopup();
    this.router.navigate(['/']);
  }
}
