import {Component, HostListener, OnInit} from '@angular/core';
import {ArticlesService} from "../../../shared/services/articles.service";
import {ArticleType} from "../../../../types/article.type";
import {CategoryService} from "../../../shared/services/category.service";
import {CategoryType} from "../../../../types/category.type";
import {ActiveParamsType} from "../../../../types/active-params.type";
import {ActivatedRoute, Router} from "@angular/router";
import {appliedFiltersType} from "../../../../types/applied-filter.type";
import {debounceTime, pipe} from "rxjs";
import {LoaderService} from "../../../shared/services/loader.service";

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {

  articles: ArticleType[] = [];
  categories: CategoryType[] = [];
  activeParams: ActiveParamsType = {categories: []};

  appliedFilters: appliedFiltersType[] = [];

  filterOpen: boolean = false;
  checked: boolean = false;

  pages: number[] = [];

  constructor(private articlesService: ArticlesService,
              private router: Router,
              private activatedRoute: ActivatedRoute,
              private loaderService: LoaderService,
              private categoryService: CategoryService) {
  }

  ngOnInit(): void {
    this.loaderService.showLoader();
    //   // Получаем категории
    this.categoryService.getCategories()
      .subscribe(data => {
        this.categories = data;

        // Получаем список статей с фильтрами из URL сразу при инициализации
        this.activatedRoute.queryParams
          .pipe(
            debounceTime(1000),
          )
          .subscribe(params => {
            const activeParams: ActiveParamsType = {categories: []};

            if (params.hasOwnProperty('categories')) {
              activeParams.categories = Array.isArray(params['categories']) ? params['categories'] : [params['categories']];
              // this.filterOpen = true;
            }
            if (params.hasOwnProperty('page')) {
              activeParams.page = +params['page'];
            }
            this.activeParams = activeParams;
            if (params['categories']) {
              this.activeParams.categories = Array.isArray(params['categories']) ? params['categories'] : [params['categories']];
            }

            this.updateAppliedFilters();
            // Запрашиваем статьи с учетом активных фильтров
            this.updateArticles();
            this.loaderService.hideLoader();
          });
      });
  };


  // Функция для получения статей с учетом активных фильтров
  updateArticles(): void {
    this.articlesService.getArticles(this.activeParams)
      .subscribe(data => {
        this.pages = [];
        for (let i = 1; i <= data.pages; i++) {
          this.pages.push(i);
        }

        this.articles = data.items;
      });
  }

  toggleFilter(): void {
    this.filterOpen = !this.filterOpen;
  };

  updateFilterParams(url: string, checked: boolean): void {
    if (this.activeParams.categories && this.activeParams.categories.length > 0) {
      const existingTypeInParams = this.activeParams.categories.find(item => item === url);
      if (existingTypeInParams && !checked) {
        this.activeParams.categories = this.activeParams.categories.filter(item => item !== url);
      } else if (!existingTypeInParams && checked) {
        // this.activeParams.categories.push(url); // в данном методе могут быть баг в angular, поэтому заменили на другой метод
        this.activeParams.categories = [...this.activeParams.categories, url];
      }
    } else if (checked) {
      this.activeParams.categories = [url];
    }
    this.activeParams.page = 1;

    if (this.activeParams.categories.length === 0) {
      this.filterOpen = false;
    }

    this.router.navigate(['/articles'], {
      queryParams: this.activeParams,
    });
  };

  updateAppliedFilters(): void {
    this.appliedFilters = this.categories
      .filter(cat => this.activeParams.categories.includes(cat.url));
  };

  removeAppliedFilter(appliedFilter: appliedFiltersType) {
    this.activeParams.categories = this.activeParams.categories.filter(item => item !== appliedFilter.url);
    this.activeParams.page = 1;
    this.router.navigate(['/articles'], {
      queryParams: this.activeParams
    });
  };

  openPage(page: number): void {
    this.activeParams.page = page;
    this.router.navigate(['/articles'], {
      queryParams: this.activeParams
    });
  };

  openPrevPage(): void {
    if (this.activeParams.page && this.activeParams.page > 1) {
      this.activeParams.page--;
      this.router.navigate(['/articles'], {
        queryParams: this.activeParams
      });
    }
  };

  openNextPage(): void {
    if (this.activeParams.page && this.activeParams.page < this.pages.length) {
      this.activeParams.page++;
      this.router.navigate(['/articles'], {
        queryParams: this.activeParams
      });
    }
  };

  // @HostListener('document:click', ['$event'])
  // click(event: Event): void {
  //   const target = event.target as HTMLElement;
  //   if (this.filterOpen && !target.className.includes('sorting-body')) {
  //     this.filterOpen = false;
  //   }
  // };
}
