import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { APP_CONFIG } from '../../core/config/app-config';
import { AppHeader } from './app-header';

describe('AppHeader', () => {
  async function renderHeader() {
    TestBed.configureTestingModule({
      imports: [AppHeader],
      providers: [
        provideRouter([]),
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

    const fixture = TestBed.createComponent(AppHeader);
    await fixture.whenStable();

    return fixture.nativeElement as HTMLElement;
  }

  it('shows the institution from configuration instead of a hardcoded name', async () => {
    const element = await renderHeader();

    expect(element.textContent).toContain('Universidad de Prueba');
  });

  it('renders navigation inside a banner landmark', async () => {
    const element = await renderHeader();

    expect(element.querySelector('header')).not.toBeNull();
  });

  it('gives the navigation an accessible name', async () => {
    const element = await renderHeader();

    expect(element.querySelector('[aria-label="Navegación principal"]')).not.toBeNull();
  });
});
