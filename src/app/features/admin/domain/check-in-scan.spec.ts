import type { Attendee, CapacityBlock, CheckInStatus } from './attendance';
import { evaluateCheckInScan } from './check-in-scan';

const BLOCK_START = new Date(2026, 7, 20, 14, 0);
const BLOCK_END = new Date(2026, 7, 20, 16, 0);
const OTHER_BLOCK_START = new Date(2026, 7, 20, 16, 0);
const OTHER_BLOCK_END = new Date(2026, 7, 20, 18, 0);

const MS_PER_MINUTE = 60_000;

function minutesFrom(instant: Date, minutes: number): Date {
  return new Date(instant.getTime() + minutes * MS_PER_MINUTE);
}

function attendee(overrides: Partial<Attendee> = {}): Attendee {
  return {
    id: 'student-1',
    name: 'Carlos Gómez',
    faculty: 'Ingeniería',
    universityId: 'U-203948',
    checkInCode: 'UG-1234',
    status: 'reserved',
    checkedInAt: null,
    checkInOpensAt: minutesFrom(BLOCK_START, -15),
    checkInClosesAt: minutesFrom(BLOCK_START, 15),
    ...overrides,
  };
}

function block(
  attendees: readonly Attendee[],
  start = BLOCK_START,
  end = BLOCK_END,
): CapacityBlock {
  return {
    spaceId: 'court-basketball-a',
    spaceName: 'Cancha de Básquetbol A',
    start,
    end,
    capacity: 30,
    attendees,
  };
}

function withStatus(status: CheckInStatus): Attendee {
  return attendee({ status });
}

const NOW = new Date(2026, 7, 20, 14, 5);

describe('evaluateCheckInScan', () => {
  it('reads a code within its check-in window as valid', () => {
    const current = block([withStatus('reserved')]);

    expect(evaluateCheckInScan('UG-1234', current, [current], NOW)).toMatchObject({
      outcome: 'valid',
    });
  });

  it('accepts the code at the exact instant its window opens or closes', () => {
    const opens = attendee({ checkInOpensAt: NOW, checkInClosesAt: minutesFrom(NOW, 15) });
    const closes = attendee({ checkInOpensAt: minutesFrom(NOW, -15), checkInClosesAt: NOW });

    expect(evaluateCheckInScan('UG-1234', block([opens]), [block([opens])], NOW).outcome).toBe(
      'valid',
    );
    expect(evaluateCheckInScan('UG-1234', block([closes]), [block([closes])], NOW).outcome).toBe(
      'valid',
    );
  });

  it('ignores whitespace and letter case when matching a hand-typed code', () => {
    const current = block([withStatus('reserved')]);

    expect(evaluateCheckInScan(' ug-1234 ', current, [current], NOW).outcome).toBe('valid');
  });

  it('reports a reservation scanned before its window opens as too early', () => {
    const early = attendee({ checkInOpensAt: minutesFrom(NOW, 1) });
    const current = block([early]);

    expect(evaluateCheckInScan('UG-1234', current, [current], NOW).outcome).toBe('tooEarly');
  });

  it('reports a reservation scanned after its window closed as expired, even while still "reserved"', () => {
    const late = attendee({ checkInClosesAt: minutesFrom(NOW, -1) });
    const current = block([late]);

    expect(evaluateCheckInScan('UG-1234', current, [current], NOW).outcome).toBe('expired');
  });

  it('reports a reservation the clock already expired', () => {
    const current = block([withStatus('expired')]);

    expect(evaluateCheckInScan('UG-1234', current, [current], NOW).outcome).toBe('expired');
  });

  it('reports a reservation already checked in as already used', () => {
    const current = block([withStatus('in_progress')]);

    expect(evaluateCheckInScan('UG-1234', current, [current], NOW).outcome).toBe('alreadyUsed');
  });

  it('reports a finished stay as already used, not as not found', () => {
    const current = block([withStatus('completed')]);

    expect(evaluateCheckInScan('UG-1234', current, [current], NOW).outcome).toBe('alreadyUsed');
  });

  it('reports a cancelled reservation as not found, the same as a code the system never issued', () => {
    const current = block([withStatus('cancelled')]);

    expect(evaluateCheckInScan('UG-1234', current, [current], NOW).outcome).toBe('notFound');
  });

  it('reports a code from another block as otherBlock, with that block attached', () => {
    const current = block([]);
    const other = block([withStatus('reserved')], OTHER_BLOCK_START, OTHER_BLOCK_END);

    const result = evaluateCheckInScan('UG-1234', current, [current, other], NOW);

    expect(result).toMatchObject({ outcome: 'otherBlock', block: { start: OTHER_BLOCK_START } });
  });

  it('does not offer a cancelled reservation from another block as otherBlock', () => {
    const current = block([]);
    const other = block([withStatus('cancelled')], OTHER_BLOCK_START, OTHER_BLOCK_END);

    expect(evaluateCheckInScan('UG-1234', current, [current, other], NOW).outcome).toBe('notFound');
  });

  it('reports a code that matches nothing at all as not found', () => {
    const current = block([withStatus('reserved')]);

    expect(evaluateCheckInScan('UG-9999', current, [current], NOW).outcome).toBe('notFound');
  });
});
