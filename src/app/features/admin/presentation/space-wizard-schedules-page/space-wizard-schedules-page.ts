import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { SpaceDraftStore } from '../../application/space-draft.store';
import { isSchedulesComplete } from '../../domain/space-draft';
import { SpaceScheduleEditor } from '../space-schedule-editor/space-schedule-editor';

/**
 * Step three: when the space opens. It is the step the whole flow depends on — without a window the
 * server generates no blocks at all, so the space would be published and unbookable.
 */
@Component({
  selector: 'app-space-wizard-schedules-page',
  imports: [SpaceScheduleEditor, TuiButton],
  templateUrl: './space-wizard-schedules-page.html',
  styleUrl: './space-wizard-schedules-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceWizardSchedulesPage {
  private readonly router = inject(Router);

  protected readonly draft = inject(SpaceDraftStore);

  protected readonly valid = computed(() => isSchedulesComplete(this.draft.schedules()));

  protected back(): void {
    void this.router.navigate(['/admin', 'spaces', 'new', 'usage']);
  }

  protected continue(): void {
    void this.router.navigate(['/admin', 'spaces', 'new', 'photos']);
  }
}
