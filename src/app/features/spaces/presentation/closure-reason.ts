import type { ClosureReason } from '../domain/closure-reason';

/**
 * How a reason reads on screen. Both sides of the product show it — the panel's select and history,
 * and the block a student cannot take — so the word lives once here. A `Record` over the domain's
 * own union, so a reason added there breaks the build until it has a label.
 */
const REASON_LABELS: Readonly<Record<ClosureReason, string>> = {
  maintenance: $localize`:@@closure.reason.maintenance:Mantenimiento`,
  technical_incident: $localize`:@@closure.reason.technicalIncident:Incidencia técnica`,
  institutional_event: $localize`:@@closure.reason.institutionalEvent:Evento institucional`,
  external_use: $localize`:@@closure.reason.externalUse:Uso reservado a terceros`,
  other: $localize`:@@closure.reason.other:Otro`,
};

export function closureReasonName(reason: ClosureReason | null): string {
  return reason === null ? '' : REASON_LABELS[reason];
}
