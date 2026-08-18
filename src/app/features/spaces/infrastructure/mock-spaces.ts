import type { Space, SpaceSlot } from '../domain/space';

const MINUTES_PER_HOUR = 60;

/** Opening windows shared by several spaces, as `[startHour, endHour]` pairs. */
const SPLIT_DAY = [
  [8, 12],
  [14, 18],
] as const;
const FULL_DAY = [[7, 21]] as const;
const AFTERNOON = [[14, 20]] as const;
const EVENING = [[17, 21]] as const;
const LATE_MORNING = [[10, 13]] as const;

/**
 * Slots are generated relative to the current day so the catalogue always has something to show
 * today: fixed calendar dates would make the mock look empty a week after it was written.
 */
function startOfDay(offset: number): Date {
  const date = new Date();

  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);

  return date;
}

function openOn(
  dayOffsets: readonly number[],
  ranges: readonly (readonly [number, number])[],
): readonly SpaceSlot[] {
  return dayOffsets.flatMap((offset) => {
    const date = startOfDay(offset);

    return ranges.map(([from, to]) => ({
      date,
      from: from * MINUTES_PER_HOUR,
      to: to * MINUTES_PER_HOUR,
    }));
  });
}

const THIS_WEEK = [0, 1, 2, 3];

/**
 * Visual mock: the catalogue's only hardcoded source, the counterpart of `MOCK_RESERVATIONS`. It
 * moves behind a domain port once the spaces API exists; nothing outside this file knows the data
 * is fabricated.
 */
export const MOCK_SPACES: readonly Space[] = [
  {
    id: 'court-basketball-a',
    name: 'Cancha de Básquetbol A',
    location: 'Complejo Deportivo Central, Zona Norte',
    category: 'sports',
    capacity: 30,
    underMaintenance: false,
    freeSlots: openOn(THIS_WEEK, SPLIT_DAY),
  },
  {
    id: 'court-basketball-b',
    name: 'Cancha de Básquetbol B',
    location: 'Complejo Deportivo Central, Zona Sur',
    category: 'sports',
    capacity: 30,
    underMaintenance: false,
    freeSlots: openOn([1, 2, 3], SPLIT_DAY),
  },
  {
    id: 'court-football',
    name: 'Cancha de Fútbol Sala',
    location: 'Complejo Deportivo Central, Pabellón 2',
    category: 'sports',
    capacity: 22,
    underMaintenance: false,
    freeSlots: openOn(THIS_WEEK, AFTERNOON),
  },
  {
    id: 'court-tennis-b',
    name: 'Cancha de Tenis B',
    location: 'Complejo Deportivo Central, Zona Este',
    category: 'sports',
    capacity: 4,
    underMaintenance: false,
    freeSlots: openOn(THIS_WEEK, FULL_DAY),
  },
  {
    id: 'court-squash',
    name: 'Cancha de Squash',
    location: 'Complejo Deportivo Central, Subsuelo',
    category: 'sports',
    capacity: 4,
    underMaintenance: true,
    freeSlots: [],
  },
  {
    id: 'pool-olympic',
    name: 'Piscina Olímpica',
    location: 'Centro Acuático, Nivel 1',
    category: 'sports',
    capacity: 50,
    underMaintenance: false,
    freeSlots: openOn(THIS_WEEK, LATE_MORNING),
  },
  {
    id: 'gym-weights',
    name: 'Gimnasio de Pesas',
    location: 'Complejo Deportivo Central, Nivel 2',
    category: 'sports',
    capacity: 15,
    underMaintenance: false,
    freeSlots: openOn(THIS_WEEK, FULL_DAY),
  },
  {
    id: 'track-athletics',
    name: 'Pista de Atletismo',
    location: 'Campus Norte, Estadio Universitario',
    category: 'sports',
    capacity: 40,
    underMaintenance: false,
    freeSlots: openOn([0, 2, 3], EVENING),
  },
  {
    id: 'court-volleyball',
    name: 'Cancha de Voleibol Playa',
    location: 'Campus Norte, Zona Recreativa',
    category: 'sports',
    capacity: 12,
    underMaintenance: false,
    freeSlots: openOn([1, 3], AFTERNOON),
  },
  {
    id: 'room-martial-arts',
    name: 'Sala de Artes Marciales',
    location: 'Complejo Deportivo Central, Nivel 3',
    category: 'sports',
    capacity: 25,
    underMaintenance: false,
    freeSlots: openOn(THIS_WEEK, EVENING),
  },
  {
    id: 'study-cubicle-104',
    name: 'Cubículo 104',
    location: 'Biblioteca Central, Nivel 1',
    category: 'study',
    capacity: 2,
    underMaintenance: false,
    freeSlots: openOn(THIS_WEEK, FULL_DAY),
  },
  {
    id: 'study-room-collaborative-b',
    name: 'Sala Colaborativa B',
    location: 'Pabellón de Ciencias, Nivel 2',
    category: 'study',
    capacity: 6,
    underMaintenance: false,
    freeSlots: openOn(THIS_WEEK, SPLIT_DAY),
  },
  {
    id: 'study-room-group-3',
    name: 'Sala de Estudio Grupal 3',
    location: 'Biblioteca Central, Nivel 2',
    category: 'study',
    capacity: 8,
    underMaintenance: false,
    freeSlots: openOn([0, 1], SPLIT_DAY),
  },
  {
    id: 'study-silent-reading',
    name: 'Sala de Lectura Silenciosa',
    location: 'Biblioteca Central, Nivel 3',
    category: 'study',
    capacity: 40,
    underMaintenance: false,
    freeSlots: openOn(THIS_WEEK, FULL_DAY),
  },
  {
    id: 'study-desk-zona-a',
    name: 'Mesa Individual - Zona A',
    location: 'Biblioteca Central, Nivel 1',
    category: 'study',
    capacity: 1,
    underMaintenance: false,
    freeSlots: openOn(THIS_WEEK, AFTERNOON),
  },
  {
    id: 'study-mac-island',
    name: 'Isla de Edición Mac',
    location: 'Facultad de Artes, Nivel 1',
    category: 'study',
    capacity: 2,
    underMaintenance: false,
    freeSlots: openOn([0, 2], LATE_MORNING),
  },
  {
    id: 'study-room-thesis',
    name: 'Sala de Tesis',
    location: 'Biblioteca Central, Nivel 4',
    category: 'study',
    capacity: 4,
    underMaintenance: true,
    freeSlots: [],
  },
  {
    id: 'study-auditorium-small',
    name: 'Auditorio Pequeño',
    location: 'Edificio de Posgrados, Nivel 1',
    category: 'study',
    capacity: 60,
    underMaintenance: false,
    freeSlots: openOn([2, 3], SPLIT_DAY),
  },
  {
    id: 'lab-chemistry-2',
    name: 'Laboratorio de Química 2',
    location: 'Edificio de Ciencias, Nivel 2',
    category: 'lab',
    capacity: 24,
    underMaintenance: false,
    freeSlots: openOn(THIS_WEEK, SPLIT_DAY),
  },
  {
    id: 'lab-physics',
    name: 'Laboratorio de Física',
    location: 'Edificio de Ciencias, Nivel 1',
    category: 'lab',
    capacity: 20,
    underMaintenance: false,
    freeSlots: openOn([0, 1, 2], LATE_MORNING),
  },
  {
    id: 'lab-makerspace',
    name: 'MakerSpace Lab',
    location: 'Facultad de Ingeniería, Nivel 2',
    category: 'lab',
    capacity: 16,
    underMaintenance: false,
    freeSlots: openOn(THIS_WEEK, AFTERNOON),
  },
  {
    id: 'lab-innovation',
    name: 'Laboratorio de Innovación',
    location: 'Edificio C, Nivel 4',
    category: 'lab',
    capacity: 18,
    underMaintenance: false,
    freeSlots: openOn([1, 2, 3], EVENING),
  },
  {
    id: 'lab-robotics',
    name: 'Laboratorio de Robótica',
    location: 'Facultad de Ingeniería, Nivel 3',
    category: 'lab',
    capacity: 12,
    underMaintenance: false,
    freeSlots: openOn(THIS_WEEK, FULL_DAY),
  },
];
