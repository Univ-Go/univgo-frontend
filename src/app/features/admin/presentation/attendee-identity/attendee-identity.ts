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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: var(--univgo-space-m);
      min-inline-size: 0;
    }

    .identity__text {
      display: flex;
      flex-direction: column;
      min-inline-size: 0;
    }

    .identity__name {
      color: var(--tui-text-primary);
      font: var(--tui-typography-ui-s);
    }

    .identity__faculty {
      color: var(--tui-text-tertiary);
      font: var(--tui-typography-ui-xs);
    }
  `,
  template: `
    <!-- The initials repeat the name beside them, so they are decoration to a screen reader. -->
    <span tuiAvatar size="s" tuiAppearance="neutral" aria-hidden="true">{{ initials() }}</span>

    <span class="identity__text">
      <span class="identity__name">{{ attendee().name }}</span>
      <span class="identity__faculty">{{ attendee().faculty }}</span>
    </span>
  `,
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
