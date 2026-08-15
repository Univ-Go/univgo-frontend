import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TuiRoot } from '@taiga-ui/core';

/**
 * `tui-root` no es decorativo: aloja los portales de Taiga (alertas, diálogos, dropdowns), así que
 * toda la aplicación tiene que vivir dentro. El tema claro/oscuro no se controla aquí: `provideTaiga`
 * refleja `TUI_DARK_MODE` sobre el atributo `tuiTheme` del documento.
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
