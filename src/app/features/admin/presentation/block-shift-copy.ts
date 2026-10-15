import type { BlockShift } from '../domain/block-schedule';

/**
 * What each shift is called and which icon stands for it. A `Record` over the domain's own union,
 * so a shift added there breaks the build here until it has both.
 */
export const BLOCK_SHIFT_LABELS: Readonly<Record<BlockShift, string>> = {
  morning: $localize`:@@admin.blocks.shift.morning:Turno mañana`,
  afternoon: $localize`:@@admin.blocks.shift.afternoon:Turno tarde`,
  night: $localize`:@@admin.blocks.shift.night:Turno noche`,
};

export const BLOCK_SHIFT_ICONS: Readonly<Record<BlockShift, string>> = {
  morning: '@tui.sunrise',
  afternoon: '@tui.sun',
  night: '@tui.moon',
};
