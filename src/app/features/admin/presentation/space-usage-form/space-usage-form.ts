import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiInputChip, TuiTextarea } from '@taiga-ui/kit';
import type { SpaceUsageDraft } from '../../domain/space-draft';

let nextFormId = 0;

/**
 * The rules are typed one per line, not comma-separated. Taiga's chip input splits on commas by
 * default, and a rule is a sentence — "Usa toalla sobre las máquinas y límpialas después de cada
 * ejercicio." would become three rules. Newlines are the one separator a rule never contains, and
 * pasting a list still works.
 */
const RULE_SEPARATOR = /\n+/;

/**
 * Level 2: what a space is *for* — the description a student reads before booking and the rules they
 * have to follow. Per space and not per category: two courts of the same kind share a taxonomy, not
 * a set of instructions.
 *
 * Like the identity form, it owns the fields and nothing else; see that component for why.
 */
@Component({
  selector: 'app-space-usage-form',
  imports: [FormsModule, TuiInputChip, TuiTextarea],
  templateUrl: './space-usage-form.html',
  styleUrl: './space-usage-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceUsageForm {
  public readonly value = model.required<SpaceUsageDraft>();
  public readonly disabled = input(false);

  protected readonly ruleSeparator = RULE_SEPARATOR;

  private readonly formId = `space-usage-${nextFormId++}`;

  protected readonly descriptionId = `${this.formId}-description`;
  protected readonly rulesId = `${this.formId}-rules`;

  protected setDescription(description: string): void {
    this.value.update((usage) => ({ ...usage, description }));
  }

  protected setRules(rules: readonly string[]): void {
    this.value.update((usage) => ({ ...usage, rules }));
  }
}
