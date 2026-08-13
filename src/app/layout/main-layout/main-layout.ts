import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';
import { AppFooter } from '../app-footer/app-footer';
import { AppHeader } from '../app-header/app-header';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Toast, AppHeader, AppFooter],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './main-layout.html',
})
export class MainLayout {
  protected readonly skipToContentLabel = $localize`:@@layout.skipToContent:Saltar al contenido principal`;
}
