import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TUI_BREAKPOINT, TuiDataList } from '@taiga-ui/core';
import { SessionStore } from '../../features/auth/application/session-store';
import { LanguageSelector } from '../../shared/language-selector/language-selector';
import { ThemeToggle } from '../../shared/theme-toggle/theme-toggle';

/**
 * Level 1: what the account dropdown contains, without saying where it hangs from. The bar opens it
 * from the avatar on a desktop and the tab bar opens it from its last tab on a phone; sharing the
 * content and letting each own its trigger keeps one list of account actions while the two triggers
 * stay what their context needs them to be.
 *
 * The utilities ride inside the menu on a phone, where there is no room for them in the bar. Both
 * surfaces are mutually exclusive by viewport, so nothing is duplicated in the accessibility tree.
 */
@Component({
  selector: 'app-account-menu',
  imports: [LanguageSelector, ThemeToggle, TuiDataList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .menu__utilities {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--univgo-space-l);
      padding: var(--univgo-space-s) var(--univgo-space-m);
      border-block-end: 1px solid var(--tui-border-normal);
    }
  `,
  template: `
    <tui-data-list>
      @if (compact()) {
        <div class="menu__utilities">
          <app-language-selector />
          <app-theme-toggle />
        </div>
      }

      <button tuiOption type="button" iconStart="@tui.user" i18n="@@navigation.profile">
        Tu perfil
      </button>

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
  private readonly breakpoint = inject(TUI_BREAKPOINT);
  private readonly session = inject(SessionStore);

  protected readonly compact = computed(() => this.breakpoint() === 'mobile');

  protected readonly signingOut = signal(false);

  /** The store clears the session and navigates whether the server answered or not. */
  protected signOut(): void {
    this.signingOut.set(true);
    this.session.signOut().subscribe({ error: () => this.signingOut.set(false) });
  }
}
