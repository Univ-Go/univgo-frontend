import type { Reservation, SpaceCategory } from '../domain/reservation';

/**
 * Static instructions per space category — this is UI copy, not per-reservation data, so it goes
 * through i18n like any other visible text. Kept here instead of in the domain because it is a
 * presentation concern (what a user reads), not a business rule.
 */
const RULES_BY_CATEGORY: Readonly<Record<SpaceCategory, readonly string[]>> = {
  sports: [
    $localize`:@@reservations.rules.sports.gear:Usa calzado deportivo adecuado para la superficie de la cancha.`,
    $localize`:@@reservations.rules.sports.capacity:Máximo 10 personas por reserva.`,
    $localize`:@@reservations.rules.sports.late:Si llegas con más de 10 minutos de retraso, la reserva se libera.`,
  ],
  study: [
    $localize`:@@reservations.rules.study.volume:Mantén un volumen bajo para no interrumpir a otros grupos.`,
    $localize`:@@reservations.rules.study.food:No se permite comida ni bebida dentro de la sala.`,
    $localize`:@@reservations.rules.study.tidy:Deja el mobiliario en su posición original al terminar.`,
  ],
  lab: [
    $localize`:@@reservations.rules.lab.protection:Usa bata y gafas de protección durante toda la sesión.`,
    $localize`:@@reservations.rules.lab.supervision:No manipules equipos sin la supervisión indicada.`,
    $localize`:@@reservations.rules.lab.incident:Reporta cualquier incidente al encargado del laboratorio de inmediato.`,
  ],
};

/**
 * Visual mock: the only hardcoded data source for the feature, shared by the list and the detail
 * view so both read the same reservation by id. Moves to a use case behind a domain port once the
 * booking API exists.
 */
export const MOCK_RESERVATIONS: readonly Reservation[] = [
  {
    id: 'court-a-oct24',
    spaceName: 'Cancha de Básquetbol A',
    location: 'Complejo Deportivo Central, Cancha A',
    date: new Date(2026, 9, 24),
    time: '14:00 – 16:00',
    status: 'upcoming',
    category: 'sports',
    rules: RULES_BY_CATEGORY.sports,
  },
  {
    id: 'study-room-3-mar18',
    spaceName: 'Sala de Estudio Grupal 3',
    location: 'Biblioteca Central, Sala 3',
    date: new Date(2026, 2, 18),
    time: '09:00 – 11:00',
    status: 'past',
    category: 'study',
    rules: RULES_BY_CATEGORY.study,
  },
  {
    id: 'lab-chemistry-2-aug16',
    spaceName: 'Laboratorio de Química 2',
    location: 'Edificio de Ciencias, Laboratorio 2',
    date: new Date(2026, 7, 16),
    time: '15:00 – 17:00',
    status: 'ongoing',
    category: 'lab',
    rules: RULES_BY_CATEGORY.lab,
  },
  {
    id: 'court-tennis-b-feb2',
    spaceName: 'Cancha de Tenis B',
    location: 'Complejo Deportivo Central, Cancha de Tenis B',
    date: new Date(2026, 1, 2),
    time: '08:00 – 09:00',
    status: 'past',
    category: 'sports',
    rules: RULES_BY_CATEGORY.sports,
  },
  {
    id: 'reading-room-sept30',
    spaceName: 'Sala de Lectura Silenciosa',
    location: 'Biblioteca Central, Sala de Lectura Silenciosa',
    date: new Date(2026, 8, 30),
    time: '10:00 – 12:00',
    status: 'upcoming',
    category: 'study',
    rules: RULES_BY_CATEGORY.study,
  },
  {
    id: 'lab-physics-aug16',
    spaceName: 'Laboratorio de Física',
    location: 'Edificio de Ciencias, Laboratorio de Física',
    date: new Date(2026, 7, 16),
    time: '11:00 – 13:00',
    status: 'ongoing',
    category: 'lab',
    rules: RULES_BY_CATEGORY.lab,
  },
];
