import type { ClosureReason } from '../../spaces/domain/closure-reason';
import { CLOSURE_REASONS } from '../../spaces/domain/closure-reason';
import { closureReasonName } from '../../spaces/presentation/closure-reason';

/**
 * The reasons as the panel's select offers them. The word itself is the space's, not the panel's —
 * the student reads it too, on the block they cannot take — so it comes from there.
 */
export const CLOSURE_REASON_OPTIONS: readonly { value: ClosureReason; label: string }[] =
  CLOSURE_REASONS.map((value) => ({ value, label: closureReasonName(value) }));

export { closureReasonName };
