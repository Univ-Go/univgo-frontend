import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiIcon } from '@taiga-ui/core';

/**
 * The wildcard route. It renders inside the shell so a lost user still has the navigation bar, the
 * account menu and the footer — a dead end without a way out is what a blank page already was.
 *
 * No state and no data: the view exists to name the situation and offer the two routes that exist.
 */
@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, TuiButton, TuiIcon],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
