import { ChangeDetectionStrategy, Component, computed, model, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiDataList, TuiInput } from '@taiga-ui/core';
import { TuiInputNumber, TuiSelect } from '@taiga-ui/kit';
import type { SpaceType } from '../../domain/admin-space-detail';
import { MAX_CAPACITY, MIN_CAPACITY, type SpaceIdentityDraft } from '../../domain/space-draft';

let nextFormId = 0;

/**
 * Level 2: what a space *is* — its name, where it is, what kind it is and how many people fit.
 *
 * It owns the fields and nothing else: no submit button, no confirmation, no in-flight state. The
 * creation wizard hosts it with a "Continuar" and writes to a draft; the edit screen hosts the very
 * same component with a "Guardar" and sends a request. A form that knew which of the two it was in
 * would be the component-with-a-mode that always grows a third.
 *
 * Validity is not exposed from here either. Both hosts compute it from the same pure predicate in
 * `space-draft.ts`, so the rule has one definition and is unit-tested without rendering anything.
 */
@Component({
  selector: 'app-space-identity-form',
  imports: [FormsModule, TuiDataList, TuiInput, TuiInputNumber, TuiSelect],
  templateUrl: './space-identity-form.html',
  styleUrl: './space-identity-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceIdentityForm {
  public readonly value = model.required<SpaceIdentityDraft>();
  public readonly types = input.required<readonly SpaceType[]>();
  public readonly disabled = input(false);

  protected readonly minCapacity = MIN_CAPACITY;
  protected readonly maxCapacity = MAX_CAPACITY;

  /** Unique ids so two instances of the form on one page keep their labels bound to their inputs. */
  private readonly formId = `space-identity-${nextFormId++}`;

  protected readonly nameId = `${this.formId}-name`;
  protected readonly locationId = `${this.formId}-location`;
  protected readonly typeId = `${this.formId}-type`;
  protected readonly capacityId = `${this.formId}-capacity`;

  protected readonly selectedType = computed(
    () => this.types().find((type) => type.id === this.value().spaceTypeId) ?? null,
  );

  protected readonly typeName = (type: SpaceType | null): string => type?.name ?? '';

  protected setName(name: string): void {
    this.value.update((identity) => ({ ...identity, name }));
  }

  protected setLocation(location: string): void {
    this.value.update((identity) => ({ ...identity, location }));
  }

  protected setType(type: SpaceType | null): void {
    this.value.update((identity) => ({ ...identity, spaceTypeId: type?.id ?? null }));
  }

  protected setCapacity(capacity: number | null): void {
    this.value.update((identity) => ({ ...identity, capacity }));
  }
}
