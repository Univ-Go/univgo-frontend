/** Human-readable length: this code gets read out loud at a desk and typed by hand. */
const CODE_DIGITS = 4;

/**
 * Visual mock standing in for the identifier the reservations API will hand back on creation.
 * Nothing reads it afterwards — the flow only shows it — so a local random value is enough until
 * the endpoint exists, and keeping it here means the swap is one file.
 */
export function createReservationCode(): string {
  const number = Math.floor(Math.random() * 10 ** CODE_DIGITS);

  return `UG-${number.toString().padStart(CODE_DIGITS, '0')}`;
}
