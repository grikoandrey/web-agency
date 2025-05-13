import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ArticleType} from "../../../../types/article.type";
import {ActivatedRoute} from "@angular/router";
import {ArticlesService} from "../../../shared/services/articles.service";
import {AuthService} from "../../../core/auth.service";
import {environment} from "../../../../environments/environment";
import {MatSnackBar} from "@angular/material/snack-bar";
import {CommentsService} from "../../../shared/services/comments.service";
import {CommentType} from "../../../../types/comment.type";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {LoaderService} from "../../../shared/services/loader.service";
import {delay} from "rxjs";
import {CommentsActionType} from "../../../../types/comments-action.type";

@Component({
  selector: 'app-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss']
})
export class ArticleComponent implements OnInit {

  RelatedArticles: ArticleType[] = [];
  article!: ArticleType;
  comments: CommentType[] = [];
  allActions: CommentsActionType[] = [];
  actions: CommentsActionType[] = [];

  serverStaticPath: string = environment.serverStaticPath;
  isLogged: boolean = false;
  showLoadMore: boolean = false;
  clearAllComments: boolean = false;
  offset: number = 3;
  allCount: number = 0;

  commentText: string = '';

  @ViewChild('commentsSection') commentsSection: ElementRef | undefined;


  constructor(private activatedRoute: ActivatedRoute,
              private authService: AuthService,
              private _snackBar: MatSnackBar,
              private commentsService: CommentsService,
              private loaderService: LoaderService,
              private articlesService: ArticlesService) {
    this.isLogged = this.authService.getIsLoggedIn();
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      this.articlesService.getArticle(params['url'])
        .subscribe((data: ArticleType) => {
          this.article = data;

          if (this.article.id && this.article.comments && this.article.comments.length > 0) {
            this.showLoadMore = true;

            this.commentsService.getCommentsAction(this.article.id)
              .subscribe((data: CommentsActionType[] | DefaultResponseType) => {
                if ((data as DefaultResponseType).error !== undefined) {
                  const error: string = (data as DefaultResponseType).message;
                  throw new Error(error);
                }
                this.allActions = data as CommentsActionType[];
                this.markUserActions(this.article.comments ?? []);
              });
          }
        });

      this.articlesService.getRelatedArticles(params['url'])
        .subscribe((data: ArticleType[]) => {
          this.RelatedArticles = data;
        });
    });
  };

  shareLink(network: string): void {
    const url: string = encodeURIComponent(window.location.href); // URL текущей страницы
    if (this.article) {
      const title: string = encodeURIComponent(this.article.title); // Заголовок статьи


      let shareUrl: string = '';

      switch (network) {
        case 'vk':
          shareUrl = `https://vk.com/share.php?url=${url}&title=${title}`;
          break;
        case 'telegram':
          shareUrl = `https://t.me/share/url?url=${url}&text=${title}`;
          break;
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
          break;
        default:
          console.warn('Неизвестная соцсеть');
          return;
      }
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  copyLink(): void {
    const url: string = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      this._snackBar.open('Ссылка скопирована в буфер обмена! Разместите ее в своем профиле!');
    }).catch(err => {
      console.error('Ошибка при копировании:', err);
    });
  };

  loadComments(): void {
    if (!this.article) return;
    this.loaderService.showLoader();
    this.commentsService.getComments({offset: this.offset, article: this.article.id})
      .pipe(delay(500))
      .subscribe((data) => {

        this.comments = [...this.comments, ...data.comments];
        this.markUserActions(data.comments);

        this.offset += data.comments.length;
        this.allCount = data.allCount;

        const totalDisplayed = (this.article?.comments?.length || 0) + this.comments.length;

        if (totalDisplayed >= this.allCount) {
          this.showLoadMore = false;
          this.clearAllComments = true;
        }
        this.loaderService.hideLoader();
      });
  };

  clearComments(): void {
    this.comments = [];
    this.showLoadMore = true;
    this.clearAllComments = false;
    this.offset = 3;

    if (this.commentsSection) {
      this.commentsSection.nativeElement.scrollIntoView({behavior: 'smooth'});
    }
  };

  giveComment(text: string, article: string): void {
    if (this.article && this.article.id) {
      this.commentsService.giveComment(text, article)
        .subscribe((data: DefaultResponseType) => {
          if (data.error) {
            throw new Error(data.message);
          } else {
            this._snackBar.open(data.message);
            this.articlesService.getArticle(this.article.url)
              .subscribe((updatedArticle: ArticleType) => {
                this.article.comments = updatedArticle.comments;
              });
            this.commentText = '';
          }
        })
    }
  };

  markUserActions(comments: CommentType[]): void {
    comments.forEach(comment => {
      const action = this.allActions.find(item => item.comment === comment.id);
      if (action) {
        (comment as any).userAction = action.action;
      }
    });
  }

  makeActionForComment(action: string, comment: CommentType): void {
    if (!this.isLogged) {
      this._snackBar.open('Для данного действия необходимо авторизоваться!');
      return;
    }
    if (this.article && this.article.id) {
      this.commentsService.actionsComment(action, comment.id)
        .subscribe({
          next: (response: DefaultResponseType) => {
            if (response.error) {
              this._snackBar.open(response.message);
              throw new Error(response.message);
            } else {
              if (action !== 'violate') {
                this.changeAction(comment);
                this._snackBar.open(response.message);
              } else {
                this._snackBar.open('Жалоба отправлена!');
              }
            }
          },
          error: (error) => {
            if (error.status === 500) {
              this._snackBar.open('Для данного действия необходимо авторизоваться!');
            } else if (error.status === 400) {
              this._snackBar.open('Жалоба уже отправлена!');
            } else {
              this._snackBar.open(error.error.message);
            }
          }
        });
    }
  };

  changeAction(comment: CommentType): void {
    this.commentsService.getCommentAction(comment.id)
      .subscribe((data: CommentsActionType[] | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          const error: string = (data as DefaultResponseType).message;
          throw new Error(error);
        }
        this.actions = data as CommentsActionType[];

        const newAction: string | null = this.actions[0]?.action || null;
        const previousAction: string | undefined = comment.userAction;

        if (!newAction) {
          // Убрали действие
          if (previousAction === 'like') {
            comment.likesCount = Math.max(0, comment.likesCount - 1);
          } else if (previousAction === 'dislike') {
            comment.dislikesCount = Math.max(0, comment.dislikesCount - 1);
          }
          comment.userAction = undefined;
        } else {
          // Добавили или сменили действие
          if (newAction === 'like') {
            if (previousAction !== 'like') {
              comment.likesCount++;
              if (previousAction === 'dislike') {
                comment.dislikesCount = Math.max(0, comment.dislikesCount - 1);
              }
            }
          } else if (newAction === 'dislike') {
            if (previousAction !== 'dislike') {
              comment.dislikesCount++;
              if (previousAction === 'like') {
                comment.likesCount = Math.max(0, comment.likesCount - 1);
              }
            }
          }
          comment.userAction = newAction;
        }
      });
  };
}
