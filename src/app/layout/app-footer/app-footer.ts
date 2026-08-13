import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { APP_CONFIG } from '../../core/config/app-config';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-footer.html',
})
export class AppFooter {
  protected readonly organizationName = inject(APP_CONFIG).organizationName;
  protected readonly currentYear = new Date().getFullYear();
}
