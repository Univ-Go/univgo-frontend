import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TUI_BREAKPOINT, TuiDataList } from '@taiga-ui/core';
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
  imports: [LanguageSelector, RouterLink, ThemeToggle, TuiDataList],
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

      <!-- TEMPORARY: walks back to sign-in. Real sign-out clears the session first. -->
      <button
        tuiOption
        type="button"
        iconStart="@tui.log-out"
        routerLink="/login"
        i18n="@@navigation.signOut"
      >
        Cerrar sesión
      </button>
    </tui-data-list>
  `,
})
export class AccountMenu {
  private readonly breakpoint = inject(TUI_BREAKPOINT);

  protected readonly compact = computed(() => this.breakpoint() === 'mobile');
}
