import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { TuiSkeleton } from '@taiga-ui/kit';
import { SpaceDraftStore } from '../../application/space-draft.store';
import { AdminSpaceCrudRepository } from '../../domain/admin-space-crud.repository';
import { isIdentityComplete } from '../../domain/space-draft';
import { SpaceIdentityForm } from '../space-identity-form/space-identity-form';

/**
 * Step one: what the space is. It hosts the shared identity form and owns only the step's action —
 * the form itself has no button, so the edit screen can reuse it with a different one.
 *
 * Validity comes from the same pure predicate the guards use, so "can I continue" has one
 * definition rather than one per place that asks.
 */
@Component({
  selector: 'app-space-wizard-identity-page',
  imports: [SpaceIdentityForm, TuiButton, TuiSkeleton],
  templateUrl: './space-wizard-identity-page.html',
  styleUrl: './space-wizard-identity-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceWizardIdentityPage {
  private readonly router = inject(Router);
  private readonly spaces = inject(AdminSpaceCrudRepository);

  protected readonly draft = inject(SpaceDraftStore);

  protected readonly types = rxResource({
    stream: () => this.spaces.spaceTypes(),
    defaultValue: [],
  });

  protected readonly valid = computed(() => isIdentityComplete(this.draft.identity()));

  protected continue(): void {
    void this.router.navigate(['/admin', 'spaces', 'new', 'usage']);
  }
}
