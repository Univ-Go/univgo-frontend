import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { APP_CONFIG } from '../../core/config/app-config';

@Component({
  selector: 'app-header',
  imports: [Menubar, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-header.html',
})
export class AppHeader {
  protected readonly organizationName = inject(APP_CONFIG).organizationName;

  protected readonly navigationLabel = $localize`:@@navigation.label:Navegación principal`;

  /** Menubar provides its own toggle below the `md` breakpoint, so there is no separate mobile menu. */
  protected readonly navigation: MenuItem[] = [
    {
      label: $localize`:@@navigation.home:Inicio`,
      icon: 'pi pi-home',
      routerLink: '/',
      routerLinkActiveOptions: { exact: true },
    },
  ];
}
