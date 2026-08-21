/**
 * Searching for "basquetbol" has to find "Cancha de Básquetbol A": on a Spanish interface an accent
 * is a spelling detail, not a different word, and nobody reaches for the accent key to search.
 */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase();
}

/**
 * Whether free text a person typed matches a subject. Every term has to appear, so typing more
 * narrows rather than widens — which is what a person expects a search box to do. An empty query
 * matches everything: nothing was asked.
 *
 * Shared by the space catalogue and the attendance roster because both look things up by the words
 * a person can name them with. An accent rule that held on one screen and not on the other would
 * make the same search behave differently depending on where it was typed.
 */
export function matchesQuery(subject: string, query: string | null): boolean {
  if (!query?.trim()) {
    return true;
  }

  const haystack = fold(subject);

  return fold(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}
