import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { TitleStrategy, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { APP_CONFIG } from '../config/app-config';
import { PageMetadataStrategy } from './page-metadata.strategy';

@Component({ template: '' })
class BlankPage {}

function alternates(): Record<string, string> {
  return Object.fromEntries(
    Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="alternate"]')).map(
      (link) => [link.hreflang, new URL(link.href).pathname],
    ),
  );
}

function canonical(): string {
  const link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  return link ? new URL(link.href).pathname : '';
}

describe('PageMetadataStrategy', () => {
  beforeEach(() => {
    document.head
      .querySelectorAll('link[rel="canonical"], link[rel="alternate"]')
      .forEach((link) => link.remove());

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'spaces',
            component: BlankPage,
            title: 'Espacios',
            data: { description: 'Listado de espacios reservables.' },
          },
          { path: 'untitled', component: BlankPage },
        ]),
        { provide: TitleStrategy, useClass: PageMetadataStrategy },
        {
          provide: APP_CONFIG,
          useValue: {
            tenantId: 'test',
            organizationName: 'Universidad de Prueba',
            apiBaseUrl: '/api',
          },
        },
      ],
    });
  });

  it('qualifies the page title with the institution', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/spaces');

    expect(TestBed.inject(Title).getTitle()).toBe('Espacios · Universidad de Prueba');
  });

  it('publishes the route description as page metadata', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/spaces');

    const meta = TestBed.inject(Meta);
    expect(meta.getTag('name="description"')?.content).toBe('Listado de espacios reservables.');
    expect(meta.getTag('property="og:description"')?.content).toBe(
      'Listado de espacios reservables.',
    );
  });

  it('still produces a title when a route declares none', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/untitled');

    expect(TestBed.inject(Title).getTitle()).toBe('Universidad de Prueba');
  });

  it('pairs the page with its twin in every other locale', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/spaces');

    expect(alternates()).toEqual({
      es: '/es/spaces',
      en: '/en/spaces',
      'x-default': '/es/spaces',
    });
  });

  it('claims the address of the locale it was built for', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/spaces');

    expect(canonical()).toBe('/es/spaces');
    expect(TestBed.inject(Meta).getTag('property="og:url"')?.content).toBe(
      `${location.origin}/es/spaces`,
    );
  });

  it('leaves view state out of the addresses it publishes', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/spaces?category=sports');

    expect(canonical()).toBe('/es/spaces');
    expect(alternates()['en']).toBe('/en/spaces');
  });

  it('rewrites the addresses instead of stacking a set per navigation', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/spaces');
    await harness.navigateByUrl('/untitled');

    expect(document.head.querySelectorAll('link[rel="alternate"]')).toHaveLength(3);
    expect(canonical()).toBe('/es/untitled');
  });
});
