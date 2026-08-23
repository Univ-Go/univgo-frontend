import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TuiAppearance } from '@taiga-ui/core';
import { TuiAvatar } from '@taiga-ui/kit';
import type { Attendee } from '../../domain/attendance';

const INITIALS = 2;

/**
 * Level 3: who a row is about. The roster shows it twice — as a table cell on a desktop and as the
 * head of a card on a phone — so the initials, the name and the faculty are laid out once here
 * rather than kept in step across two templates.
 */
@Component({
  selector: 'app-attendee-identity',
  imports: [TuiAppearance, TuiAvatar],
  templateUrl: './attendee-identity.html',
  styleUrl: './attendee-identity.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendeeIdentity {
  public readonly attendee = input.required<Attendee>();

  protected readonly initials = computed(() =>
    this.attendee()
      .name.split(/\s+/)
      .filter(Boolean)
      .slice(0, INITIALS)
      .map((word) => word.charAt(0))
      .join(''),
  );
}
