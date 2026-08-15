import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TuiRoot } from '@taiga-ui/core';

/**
 * `tui-root` is not decorative: it hosts Taiga's portals (alerts, dialogs, dropdowns), so the whole
 * application has to live inside it. The light/dark theme is not controlled here — `provideTaiga`
 * mirrors `TUI_DARK_MODE` onto the document's `tuiTheme` attribute.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TuiRoot],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tui-root>
      <router-outlet />
    </tui-root>
  `,
})
export class App {}
