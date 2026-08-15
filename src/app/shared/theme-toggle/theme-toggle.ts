import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TUI_DARK_MODE, TuiButton } from '@taiga-ui/core';

/**
 * Level 1: the theme switch has to be reachable from every view, so it lives in `shared/` rather
 * than inside a feature. Persistence is not implemented here — `TUI_DARK_MODE` is a writable signal
 * that already initialises from `localStorage` or `prefers-color-scheme` and stores manual changes.
 */
@Component({
  selector: 'app-theme-toggle',
  imports: [TuiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      tuiIconButton
      type="button"
      size="s"
      appearance="flat"
      [iconStart]="darkMode() ? '@tui.sun' : '@tui.moon'"
      [attr.aria-pressed]="darkMode()"
      [attr.aria-label]="label()"
      (click)="darkMode.set(!darkMode())"
    ></button>
  `,
})
export class ThemeToggle {
  protected readonly darkMode = inject(TUI_DARK_MODE);

  protected readonly label = () =>
    this.darkMode()
      ? $localize`:@@theme.switchToLight:Cambiar al tema claro`
      : $localize`:@@theme.switchToDark:Cambiar al tema oscuro`;
}
