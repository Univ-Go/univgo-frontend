import type { ClosureReason } from '../domain/space-closure';
import { CLOSURE_REASONS } from '../domain/space-closure';

/**
 * How a reason reads on screen: the select's options and the history table's cells both need the
 * word, so it lives once here rather than beside each template. A `Record` over the domain's own
 * union, so a reason added there breaks the build here until it has a label.
 */
const REASON_LABELS: Readonly<Record<ClosureReason, string>> = {
  maintenance: $localize`:@@admin.closure.reason.maintenance:Mantenimiento`,
  technical_incident: $localize`:@@admin.closure.reason.technicalIncident:Incidencia técnica`,
  institutional_event: $localize`:@@admin.closure.reason.institutionalEvent:Evento institucional`,
  external_use: $localize`:@@admin.closure.reason.externalUse:Uso reservado a terceros`,
  other: $localize`:@@admin.closure.reason.other:Otro`,
};

export const CLOSURE_REASON_OPTIONS: readonly { value: ClosureReason; label: string }[] =
  CLOSURE_REASONS.map((value) => ({ value, label: REASON_LABELS[value] }));

export function closureReasonName(reason: ClosureReason | null): string {
  return reason === null ? '' : REASON_LABELS[reason];
}
