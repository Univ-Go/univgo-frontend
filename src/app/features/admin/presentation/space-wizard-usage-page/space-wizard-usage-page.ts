import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { SpaceDraftStore } from '../../application/space-draft.store';
import { isUsageComplete } from '../../domain/space-draft';
import { SpaceUsageForm } from '../space-usage-form/space-usage-form';

/** Step two: what the space is for, and what a student has to respect while using it. */
@Component({
  selector: 'app-space-wizard-usage-page',
  imports: [SpaceUsageForm, TuiButton],
  templateUrl: './space-wizard-usage-page.html',
  styleUrl: './space-wizard-usage-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceWizardUsagePage {
  private readonly router = inject(Router);

  protected readonly draft = inject(SpaceDraftStore);

  protected readonly valid = computed(() => isUsageComplete(this.draft.usage()));

  protected back(): void {
    void this.router.navigate(['/admin', 'spaces', 'new', 'identity']);
  }

  protected continue(): void {
    void this.router.navigate(['/admin', 'spaces', 'new', 'schedules']);
  }
}
