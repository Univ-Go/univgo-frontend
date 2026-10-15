import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiDataList } from '@taiga-ui/core';
import { SessionStore } from '../../features/auth/application/session-store';
import { profilePathFor } from '../../features/auth/domain/session';

/**
 * Level 1: what the account dropdown contains, without saying where it hangs from. Both shells open
 * it from the avatar in their own bar; sharing the content and letting each own its trigger keeps
 * one list of account actions while the two triggers stay what their context needs them to be.
 *
 * It holds account actions only. Language and theme used to ride in here on a phone, back when the
 * bars dropped them at that width and the tab bar carried the account instead; now both bars keep
 * the avatar and the utilities beside it at every width, so a copy in the menu would be a second
 * entry in the accessibility tree for the same control.
 */
@Component({
  selector: 'app-account-menu',
  imports: [RouterLink, TuiDataList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tui-data-list>
      <a tuiOption iconStart="@tui.user" [routerLink]="profilePath()" i18n="@@navigation.profile">
        Tu perfil
      </a>

      <button
        tuiOption
        type="button"
        iconStart="@tui.log-out"
        [disabled]="signingOut()"
        (click)="signOut()"
        i18n="@@navigation.signOut"
      >
        Cerrar sesión
      </button>
    </tui-data-list>
  `,
})
export class AccountMenu {
  private readonly session = inject(SessionStore);

  protected readonly signingOut = signal(false);

  protected readonly profilePath = computed(() =>
    profilePathFor(this.session.user()?.role ?? 'student'),
  );

  /** The store clears the session and navigates whether the server answered or not. */
  protected signOut(): void {
    this.signingOut.set(true);
    this.session.signOut().subscribe({ error: () => this.signingOut.set(false) });
  }
}
