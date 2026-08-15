import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiLink } from '@taiga-ui/core';
import { APP_CONFIG } from '../../core/config/app-config';

/** Level 1: closes every view inside the shell. */
@Component({
  selector: 'app-footer',
  imports: [TuiLink],
  templateUrl: './app-footer.html',
  styleUrl: './app-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppFooter {
  protected readonly organizationName = inject(APP_CONFIG).organizationName;
  protected readonly currentYear = new Date().getFullYear();
}
