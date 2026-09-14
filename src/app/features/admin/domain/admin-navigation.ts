/**
 * Swaps only the `:spaceId` segment right after `/admin/`, leaving the current section, any further
 * segment and the query string untouched. `docs/booking-flow.md` §11: switching space changes the
 * subject of whatever screen is open, not the screen itself — a text replace on the URL is what
 * keeps that true without either side having to know what the other looks like.
 *
 * A first-occurrence replace is enough: `/admin/${currentSpaceId}` occurs exactly once, at the front
 * of every admin URL under this scheme.
 */
export function withSpaceId(url: string, currentSpaceId: string, nextSpaceId: string): string {
  return url.replace(`/admin/${currentSpaceId}`, `/admin/${nextSpaceId}`);
}
