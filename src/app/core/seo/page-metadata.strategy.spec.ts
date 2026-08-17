import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { TitleStrategy, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { APP_CONFIG } from '../config/app-config';
import { PageMetadataStrategy } from './page-metadata.strategy';

@Component({ template: '' })
class BlankPage {}

describe('PageMetadataStrategy', () => {
  beforeEach(() => {
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
});
