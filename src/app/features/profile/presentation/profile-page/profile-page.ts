import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, type ValidatorFn, Validators } from '@angular/forms';
import { TuiAppearance, TuiButton, TuiError, TuiIcon, TuiInput, TuiLoader } from '@taiga-ui/core';
import { TuiPassword } from '@taiga-ui/kit';
import { TuiCardLarge, TuiForm, TuiSurface } from '@taiga-ui/layout';
import { createAppError, isAppError } from '../../../../core/errors/app-error';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { SessionStore } from '../../../auth/application/session-store';
import { PASSWORD_MIN_LENGTH, ProfileRepository } from '../../domain/profile.repository';

// `Validators.required` never reads `this`, but the unbound-method rule cannot know that.
const required: ValidatorFn = (control) => Validators.required(control);

const confirmationMatches: ValidatorFn = (group) =>
  group.get('newPassword')?.value === group.get('confirmation')?.value ? null : { mismatch: true };

@Component({
  selector: 'app-profile-page',
  imports: [
    ReactiveFormsModule,
    TuiAppearance,
    TuiButton,
    TuiCardLarge,
    TuiError,
    TuiForm,
    TuiIcon,
    TuiInput,
    TuiLoader,
    TuiPassword,
    TuiSurface,
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  private readonly profile = inject(ProfileRepository);
  private readonly session = inject(SessionStore);
  private readonly notifications = inject(NotificationService);

  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      currentPassword: ['', required],
      newPassword: ['', [required, Validators.minLength(PASSWORD_MIN_LENGTH)]],
      confirmation: ['', required],
    },
    { validators: confirmationMatches },
  );

  protected readonly submitting = signal(false);

  /** Shown beside the form, like a refused sign-in: it is what the user has to fix next. */
  protected readonly wrongCurrentPassword = signal(false);

  protected readonly currentRequiredMessage = $localize`:@@profile.password.currentRequired:Introduce tu contraseña actual.`;
  protected readonly newTooShortMessage = $localize`:@@profile.password.newTooShort:La nueva contraseña debe tener al menos ${PASSWORD_MIN_LENGTH}:minLength: caracteres.`;
  protected readonly mismatchMessage = $localize`:@@profile.password.mismatch:Las contraseñas no coinciden.`;

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.wrongCurrentPassword.set(false);

    this.profile.changePassword(this.form.getRawValue()).subscribe({
      // The server has just revoked every session of the account, this one included. Signing out
      // now says so plainly, instead of letting the session die unannounced when its token runs out.
      next: () => {
        this.notifications.success(
          $localize`:@@profile.password.changedSummary:Contraseña actualizada`,
          $localize`:@@profile.password.changedDetail:Inicia sesión de nuevo con tu nueva contraseña.`,
        );
        this.session.signOut().subscribe({ error: () => this.submitting.set(false) });
      },
      error: (error: unknown) => {
        this.submitting.set(false);

        if (isAppError(error) && error.code === 'validation') {
          this.wrongCurrentPassword.set(true);
        } else {
          this.notifications.error(isAppError(error) ? error : createAppError('unknown'));
        }
      },
    });
  }
}
