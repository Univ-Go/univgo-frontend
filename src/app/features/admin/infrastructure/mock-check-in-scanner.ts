import type { ScanResult } from '../domain/check-in-scan';
import { evaluateCheckInScan } from '../domain/check-in-scan';
import { MOCK_SPACE_SCHEDULE, MOCK_SPACES } from './mock-attendance';

/**
 * What a real check-in request would cost. It exists so the scanning view has something to show
 * its "verificando…" state for — without it, `evaluateCheckInScan` resolves synchronously and the
 * loading state this feature is required to have would never be exercised.
 */
const SIMULATED_DELAY_MS = 400;

/**
 * Visual mock standing in for the check-in endpoint. `MOCK_SPACES` already holds one block per
 * space — the one in progress right now (`infrastructure/mock-attendance.ts`) — which is exactly
 * the block a scan is ever checked against, per `docs/booking-flow.md` §9. The scanning view only
 * knows this function's shape; it moves behind a domain port once the endpoint exists.
 */
export function scanCheckInCode(
  code: string,
  spaceId: string,
  now: Date = new Date(),
): Promise<ScanResult> {
  const currentBlock = MOCK_SPACES.find((space) => space.spaceId === spaceId);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        currentBlock
          ? evaluateCheckInScan(code, currentBlock, MOCK_SPACE_SCHEDULE, now)
          : { outcome: 'notFound' },
      );
    }, SIMULATED_DELAY_MS);
  });
}

/**
 * There is no QR to point a camera at yet — codes are generated fresh, at random, every time the
 * mock rebuilds — so this is the only way to find one to try the manual field with. Prints the
 * current block's codes to the console when the scanning view opens or the space changes. Gone the
 * day a real reservation hands back a code (and a QR) of its own.
 */
export function logMockCheckInCodes(spaceId: string): void {
  const block = MOCK_SPACES.find((space) => space.spaceId === spaceId);

  if (!block) {
    return;
  }

  console.info(`[mock] Códigos de check-in para ${block.spaceName}:`);
  console.table(
    block.attendees.map((attendee) => ({
      code: attendee.checkInCode,
      name: attendee.name,
      status: attendee.status,
    })),
  );
}
