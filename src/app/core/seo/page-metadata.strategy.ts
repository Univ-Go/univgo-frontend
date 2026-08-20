import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import {
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
  TitleStrategy,
} from '@angular/router';
import { APP_CONFIG } from '../config/app-config';
import { APP_LOCALES, DEFAULT_LOCALE, localePath, resolveLocale } from '../i18n/locales';

const TITLE_SEPARATOR = ' · ';
const QUERY_OR_FRAGMENT = /[?#]/;

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
  private readonly document = inject(DOCUMENT);

  private readonly locale = resolveLocale(new URL(this.document.baseURI).pathname);

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

    this.updateAddresses(state.url);
  }

  /**
   * Every page exists once per locale build, at the same route under a different base href. Left
   * undeclared, a crawler reads the two as duplicates and indexes whichever it saw first; `hreflang`
   * pairs them so each language reaches the audience that asked for it, and `canonical` names the
   * one this build owns. Query strings are dropped on purpose: they carry view state, such as the
   * category filter of the space listing, not a different page.
   */
  private updateAddresses(routeUrl: string): void {
    const { origin } = this.document.location;
    const path = routeUrl.split(QUERY_OR_FRAGMENT)[0];
    const canonical = origin + localePath(this.locale.code, path);

    this.setLink('canonical', null, canonical);
    this.meta.updateTag({ property: 'og:url', content: canonical });

    for (const locale of APP_LOCALES) {
      this.setLink('alternate', locale.code, origin + localePath(locale.code, path));
    }
    this.setLink('alternate', 'x-default', origin + localePath(DEFAULT_LOCALE.code, path));
  }

  private setLink(rel: string, hreflang: string | null, href: string): void {
    const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
    let link = this.document.head.querySelector<HTMLLinkElement>(selector);

    if (!link) {
      link = this.document.createElement('link');
      link.rel = rel;
      if (hreflang) {
        link.hreflang = hreflang;
      }
      this.document.head.appendChild(link);
    }

    link.href = href;
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
