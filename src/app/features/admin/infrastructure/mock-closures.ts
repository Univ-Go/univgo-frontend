import type { SpaceClosure } from '../domain/space-closure';

const NOW = new Date();
const MS_PER_DAY = 86_400_000;

function daysFrom(days: number): Date {
  return new Date(NOW.getTime() + days * MS_PER_DAY);
}

function atHour(date: Date, hour: number): Date {
  const withHour = new Date(date);

  withHour.setHours(hour, 0, 0, 0);

  return withHour;
}

/**
 * Visual mock: dated relative to the moment the app loads, like `MOCK_SPACES`, so the demo always
 * shows one of each status (completed, active, scheduled) instead of a fixed set of 2023 dates that
 * would read as stale the day after they were written. It moves behind a port once the closures API
 * exists.
 */
export const MOCK_CLOSURES: readonly SpaceClosure[] = [
  {
    id: 'closure-1',
    spaceId: 'court-basketball-a',
    scope: 'full_day',
    date: daysFrom(-6),
    start: null,
    end: null,
    recurrence: null,
    reason: 'maintenance',
    details: 'Cambio de piso deportivo y revisión de tableros.',
    authorizedBy: 'Admin Principal',
  },
  {
    id: 'closure-2',
    spaceId: 'court-basketball-a',
    scope: 'time_block',
    date: daysFrom(-2),
    start: atHour(daysFrom(-2), 14),
    end: atHour(daysFrom(-2), 18),
    recurrence: null,
    reason: 'technical_incident',
    details: 'Falla eléctrica en el marcador electrónico.',
    authorizedBy: 'Coord. Deportes',
  },
  {
    id: 'closure-3',
    spaceId: 'court-basketball-a',
    scope: 'time_block',
    date: NOW,
    start: atHour(NOW, Math.max(0, NOW.getHours() - 1)),
    end: atHour(NOW, Math.min(23, NOW.getHours() + 2)),
    recurrence: null,
    reason: 'technical_incident',
    details: 'Fuga de agua reportada por conserjería.',
    authorizedBy: 'Coord. Deportes',
  },
  {
    id: 'closure-4',
    spaceId: 'court-basketball-a',
    scope: 'full_day',
    date: daysFrom(9),
    start: null,
    end: null,
    recurrence: null,
    reason: 'institutional_event',
    details: 'Ceremonia de graduación de la Facultad de Ingeniería.',
    authorizedBy: 'Rectorado',
  },
  {
    id: 'closure-5',
    spaceId: 'court-basketball-a',
    scope: 'full_day',
    date: daysFrom(-20),
    start: null,
    end: null,
    recurrence: null,
    reason: 'maintenance',
    details: null,
    authorizedBy: 'Admin Principal',
  },
  {
    id: 'closure-6',
    spaceId: 'court-basketball-a',
    scope: 'recurring',
    date: daysFrom(-30),
    start: null,
    end: null,
    recurrence: {
      weekdays: [2, 4],
      startTime: atHour(NOW, 18),
      endTime: atHour(NOW, 20),
      until: null,
    },
    reason: 'external_use',
    details: 'Uso semanal del Club Deportivo Municipal.',
    authorizedBy: 'Admin Principal',
  },
];
