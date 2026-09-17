import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, type ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TuiButton, TuiError, TuiIcon, TuiInput, TuiLoader, TuiTitle } from '@taiga-ui/core';
import { TuiBadge, TuiPassword } from '@taiga-ui/kit';
import { TuiForm } from '@taiga-ui/layout';
import { APP_CONFIG } from '../../../../core/config/app-config';
import { BrandLogo } from '../../../../shared/brand/brand-logo';
import { LanguageSelector } from '../../../../shared/language-selector/language-selector';
import { ThemeToggle } from '../../../../shared/theme-toggle/theme-toggle';
import { SessionStore } from '../../application/session-store';

// `Validators.required` never reads `this`, but the unbound-method rule cannot know that.
// Wrapping it here keeps the rule doing its job everywhere else.
const required: ValidatorFn = (control) => Validators.required(control);

@Component({
  selector: 'app-login-page',
  imports: [
    BrandLogo,
    ReactiveFormsModule,
    TuiBadge,
    TuiButton,
    TuiError,
    TuiForm,
    TuiIcon,
    TuiInput,
    TuiLoader,
    TuiPassword,
    TuiTitle,
    LanguageSelector,
    ThemeToggle,
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly organizationName = inject(APP_CONFIG).organizationName;
  protected readonly currentYear = new Date().getFullYear();

  protected readonly form = inject(FormBuilder).nonNullable.group({
    identifier: ['', required],
    password: ['', required],
  });

  protected readonly submitting = signal(false);

  /**
   * Rejected credentials are shown beside the form rather than as a transient alert: it is the
   * answer to what the user just did, and it has to stay on screen while they correct it.
   */
  protected readonly failed = signal(false);

  protected readonly identifierMessage = $localize`:@@auth.login.identifierRequired:Introduce tu correo institucional o tu documento.`;
  protected readonly passwordMessage = $localize`:@@auth.login.passwordRequired:Introduce tu contraseña.`;

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.failed.set(false);

    this.session.signIn(this.form.getRawValue()).subscribe({
      next: () => {
        const redirect = this.route.snapshot.queryParamMap.get('redirect');
        void this.router.navigateByUrl(redirect ?? this.session.landingPath());
      },
      error: () => {
        this.submitting.set(false);
        this.failed.set(true);
      },
    });
  }
}
