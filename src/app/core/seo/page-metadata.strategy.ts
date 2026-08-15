import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import {
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
  TitleStrategy,
} from '@angular/router';
import { APP_CONFIG } from '../config/app-config';

const TITLE_SEPARATOR = ' · ';

/**
 * Keeps document metadata in step with navigation. Driving it from route configuration rather than
 * from each component means a new page cannot ship without a title, and the institution name comes
 * from `APP_CONFIG` so nothing here is tied to one university.
 */
@Injectable({ providedIn: 'root' })
export class PageMetadataStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly config = inject(APP_CONFIG);

  override updateTitle(state: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(state);
    const documentTitle = pageTitle
      ? `${pageTitle}${TITLE_SEPARATOR}${this.config.organizationName}`
      : this.config.organizationName;

    this.title.setTitle(documentTitle);
    this.meta.updateTag({ property: 'og:title', content: documentTitle });

    const description = this.readDescription(state.root);
    if (description) {
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:description', content: description });
    }
  }

  private readDescription(root: ActivatedRouteSnapshot): string | undefined {
    let route = root;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const description: unknown = route.data['description'];
    return typeof description === 'string' ? description : undefined;
  }
}
