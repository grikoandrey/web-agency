import {Component, ElementRef, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {OwlOptions} from "ngx-owl-carousel-o";
import {ArticlesService} from "../../shared/services/articles.service";
import {ArticleType} from "../../../types/article.type";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {FormBuilder, Validators} from "@angular/forms";
import {CategoryType} from "../../../types/category.type";
import {CategoryService} from "../../shared/services/category.service";
import {OrderService} from "../../shared/services/order.service";
import {OrderType} from "../../../types/order.type";
import {advantages, mains, reviews, services} from "../../shared/data/main.data";
import {MatSnackBar} from "@angular/material/snack-bar";
import {DefaultResponseType} from "../../../types/default-response.type";
import {Router} from "@angular/router";
import {UserInfoType} from "../../../types/user-info.type";
import {AuthService} from "../../core/auth.service";
import {UserService} from "../../shared/services/user.service";

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  customOptionsMain: OwlOptions = {
    loop: true,
    mouseDrag: false,
    touchDrag: false,
    pullDrag: false,
    margin: 0,
    dots: true,
    navSpeed: 1200,
    navText: ['', ''],
    responsive: {
      0: {
        items: 1
      },
    },
    nav: false
  };
  customOptionsReviews: OwlOptions = {
    loop: true,
    mouseDrag: false,
    touchDrag: false,
    pullDrag: false,
    margin: 26,
    dots: false,
    navSpeed: 700,
    navText: ['', ''],
    responsive: {
      0: {
        items: 1
      },
      400: {
        items: 2
      },
      740: {
        items: 3
      },
    },
    nav: false
  };

  mains = mains;
  reviews = reviews;
  advantages = advantages;
  services = services;

  articles: ArticleType[] = [];
  categories: CategoryType[] = [];

  orderForm = this.fb.group({
    serviceType: ['', Validators.required],
    firstName: ['', [Validators.required, Validators.pattern(/^[А-ЯA-Z][а-яa-z]+$/)]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
  });

  @ViewChild('main_popup') popup!: TemplateRef<ElementRef>;

  dialogRef: MatDialogRef<any> | null = null;

  isSuccess: boolean = false;
  errorMessage: string | null = null;

  isLogged: boolean = false;
  user: UserInfoType | null = null;

  constructor(private articlesService: ArticlesService,
              private categoryService: CategoryService,
              private authService: AuthService,
              private userService: UserService,
              private dialog: MatDialog,
              private fb: FormBuilder,
              private _snackBar: MatSnackBar,
              private router: Router,
              private orderService: OrderService) {
    this.isLogged = this.authService.getIsLoggedIn();
  }

  ngOnInit(): void {
    this.articlesService.getPopArticles().subscribe((data: ArticleType[]) => {
      this.articles = data;
    })
  }

  createOrder(serviceId: string): void {
    this.isSuccess = false;
    this.orderForm.reset();
    this.errorMessage = null;

    this.categoryService.getCategories()
      .subscribe(data => {
        this.categories = data;

        this.orderForm.patchValue({
          serviceType: serviceId,
        });

        this.authService.isLogged$.subscribe((isLoggedIn: boolean) => {
          this.isLogged = isLoggedIn;
        });

        if (this.isLogged) {
          const user = this.userService.user;
          this.user = user;

          if (user?.name) {
            this.orderForm.patchValue({ firstName: user.name });
          }
        }
        this.dialogRef = this.dialog.open(this.popup);
      });
  };

  closePopup(): void {
    this.dialogRef?.close();
    this.isSuccess = false;
    this.orderForm.reset();
    this.errorMessage = null;
  };

  sendOrder(type: string): void {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched(); // показать ошибки
      return;
    }

    const formData = this.orderForm.value;

    const selectedCategory = this.categories.find(
      category => category.id === formData.serviceType
    );

    const dataPhone: string = '+7' + (formData.phone ?? '');

    const orderData: OrderType = {
      name: formData.firstName ?? '',
      phone: dataPhone,
      service: selectedCategory?.name ?? '',
      type: type, // передаётся вручную при клике на кнопку
    };

    this.orderService.order(orderData).subscribe({
      next: (data: DefaultResponseType) => {
        if (data.error) {
          this.errorMessage = 'Произошла ошибка при отправке формы, попробуйте еще раз.';
          this._snackBar.open(data.message);
        } else {
          this.isSuccess = true;
          this.errorMessage = null;
        }
      },
      error: (err) => {
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
