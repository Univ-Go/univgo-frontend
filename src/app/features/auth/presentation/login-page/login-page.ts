import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiCheckbox, TuiIcon, TuiInput, TuiLink, TuiTitle } from '@taiga-ui/core';
import { TuiBadge, TuiPassword } from '@taiga-ui/kit';
import { TuiForm } from '@taiga-ui/layout';
import { APP_CONFIG } from '../../../../core/config/app-config';
import { BrandLogo } from '../../../../shared/brand-logo/brand-logo';
import { LanguageSelector } from '../../../../shared/language-selector/language-selector';
import { ThemeToggle } from '../../../../shared/theme-toggle/theme-toggle';

/**
 * Visual mock: the layout and the component inventory are final, the behaviour is not. Both buttons
 * are `type="button"` so nothing submits until the sign-in use case exists — with two fields and no
 * submit button the browser also performs no implicit submission.
 */
@Component({
  selector: 'app-login-page',
  imports: [
    BrandLogo,
    TuiBadge,
    TuiButton,
    TuiCheckbox,
    TuiForm,
    TuiIcon,
    TuiInput,
    TuiLink,
    TuiPassword,
    TuiTitle,
    LanguageSelector,
    RouterLink,
    ThemeToggle,
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  protected readonly organizationName = inject(APP_CONFIG).organizationName;
  protected readonly currentYear = new Date().getFullYear();
}
