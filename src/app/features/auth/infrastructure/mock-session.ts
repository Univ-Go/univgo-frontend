/**
 * Visual mock: the signed-in user. One source for every surface that greets or identifies them —
 * the application bar and the home view — so the name cannot say one thing in the header and
 * another in the greeting.
 *
 * Replaced by whatever the sign-in use case returns once authentication exists; the consumers then
 * read a session from a port instead of importing a constant.
 */
export const MOCK_SESSION_USER = {
  name: 'Mateo',
} as const;
