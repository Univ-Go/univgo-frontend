import { Directive, inject } from '@angular/core';
import { TUI_DARK_MODE } from '@taiga-ui/core';

/**
 * Level 1: puts `tui-action-bar` back on the application's theme.
 *
 * The component hardcodes `tuiTheme="dark"` on its host, which is right for a bar floating over
 * arbitrary content and wrong here: on a light page it reads as a stray dark slab and its secondary
 * text loses contrast. The attribute is rebound rather than restyled because the theme drives a
 * whole set of variables, and a binding is used rather than a static attribute because host
 * bindings are applied after the component's own host attributes.
 *
 * One directive rather than the binding copied into every view that raises a bar: the reason it is
 * needed is not obvious from the markup, and it belongs next to the fix, once.
 */
@Directive({
  selector: '[appActionBarTheme]',
  host: { '[attr.tuiTheme]': 'darkMode() ? "dark" : "light"' },
})
export class ActionBarTheme {
  protected readonly darkMode = inject(TUI_DARK_MODE);
}
