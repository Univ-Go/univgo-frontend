# UnivGo — Frontend

Booking platform for university spaces (sports facilities and study rooms). The application is
built for a single institution today but is deliberately kept tenant-agnostic: identity, wording,
colour and endpoints are all resolved through configuration rather than written into components.

## Requirements

Angular 22 requires Node `^22.22.3 || ^24.15.0 || >=26.0.0` (this is enforced by `engines` in
`package.json`). Older Node releases fail during the CLI's own version check.

The package manager is **pnpm**, pinned by `packageManager` in `package.json`. pnpm honours that
field and refuses to run if it names a different manager. npm does **not** honour it — it currently
fails here only incidentally, by crashing on pnpm's `node_modules` layout. To make the pin binding
for every manager, enable Corepack once per machine:

```bash
corepack enable
```

The only valid lockfile is `pnpm-lock.yaml`.

```bash
pnpm install
pnpm start        # http://localhost:4200 in Spanish
pnpm start:en     # the same app served from the English translation
```

### Install scripts are disabled

`pnpm-workspace.yaml` sets `onlyBuiltDependencies: []`, so **no dependency may run install scripts**.
This is the main supply-chain hardening in the project: a compromised transitive package cannot
execute code merely because it was installed. The toolchain was verified to build, test and lint
with the allowlist empty — esbuild resolves its binary through a platform-specific optional
dependency, and `lmdb`/`msgpackr-extract`/`@parcel/watcher` fall back to JS or prebuilt binaries.

If a build ever fails because of this, add **that one package** to `onlyBuiltDependencies`. Never run
`pnpm approve-builds` and accept everything.

## Scripts

| Script               | Purpose                                                                             |
| -------------------- | ----------------------------------------------------------------------------------- |
| `pnpm start`         | Dev server, source locale (`es`)                                                    |
| `pnpm start:en`      | Dev server, English translation — use it to catch layout breaks from longer strings |
| `pnpm build`         | Production build, emits `dist/univgo-frontend/browser/{es,en}`                      |
| `pnpm test`          | Unit tests (Vitest + jsdom)                                                         |
| `pnpm test:coverage` | Same, writing `coverage/univgo-frontend/lcov.info`                                  |
| `pnpm lint`          | ESLint, including Angular template accessibility rules                              |
| `pnpm format`        | Prettier                                                                            |
| `pnpm i18n:extract`  | Refresh `src/locale/messages.xlf` from the source                                   |

## Architecture

Ports and adapters. Dependencies point inwards; nothing in `core/` imports from `features/`.

```
src/app/
  core/          Cross-cutting infrastructure, no business rules
    config/      AppConfig contract + APP_CONFIG token (per-tenant values)
    errors/      Error vocabulary, HTTP mapping, user-facing wording
    http/        Interceptors
    logging/     Logger port + console adapter
    notifications/  The single entry point for transient user messages
    seo/         Route-driven document metadata
    theme/       Theme configuration and brand palette
  layout/        Level 1: the application shell (header, footer, main layout)
  features/      One folder per feature
    <feature>/
      domain/          Entities and rules (framework-free)
      application/     Use cases, orchestration
      infrastructure/  Adapters implementing domain ports (HTTP, storage)
      presentation/    Components, the only layer that touches Angular templates
  shared/        Level 2/3 components reused across features
```

Only `presentation/` exists under the current features, because neither of them has business rules
yet. Add the inner layers when a feature actually gains them — not in advance.

The views that currently live there (`home`, `not-found`, and the header/footer shell) are throwaway
bootstrap placeholders and will be rebuilt from scratch with the real structure. Don't port them.

### Component levels

1. **Global** (`layout/`, `shared/`) — used across features, no feature-specific logic.
2. **Feature** (`features/<feature>/presentation/`) — reused within one feature.
3. **View** — used by a single page; extract only when it earns its own file.

Use Taiga UI whenever it offers the component. Write a bespoke component only when Taiga UI has no
equivalent, and say why in the component.

## Design tokens

**There is no Tailwind.** Styles are written in SCSS using Taiga UI's own theming mechanisms, which
are the single design system — keeping two of them is how a utility class and a component end up
resolving to different colours.

In order of preference: override the **global CSS variables** for the light and dark themes (the
main route for colour), use the library's **LESS/SCSS mixins** to build new appearances, reach for
**configuration tokens and injectable signals** such as `TUI_DARK_MODE`, and only as a last resort
**override style classes** locally or globally.

Check whether Taiga already defines a token before inventing one — colour, typography, spacing, radii
and shadows are all covered. See <https://taiga-ui.dev/colors> and <https://taiga-ui.dev/typography>.
Project-specific variables are for concepts Taiga does not cover, and live in one file.

Colour must have **one** source of truth: retheming for another institution has to stay a
single-point change, which is what keeps the multitenancy groundwork meaningful.

Dark mode uses `TUI_DARK_MODE`, an injectable `WritableSignal<boolean>` that initialises from
`localStorage` or `prefers-color-scheme` and persists manual changes. No toggle ships yet.

## Internationalisation

`@angular/localize`, with `es` as the source locale and `en` as a translation. Every user-visible
string is marked with an explicit, stable id (`@@feature.element`).

Adding or changing wording:

1. Mark it up — `i18n="@@some.id"` in templates, `` $localize`:@@some.id:Texto` `` in TypeScript.
2. Run `pnpm i18n:extract`.
3. Add the matching `<trans-unit>` to `src/locale/messages.en.xlf`.

Production builds set `i18nMissingTranslation: "error"`, so an untranslated string fails the build
rather than silently falling back to Spanish.

Avoid interpolating names into sentences where grammar depends on them (articles, gender) — it does
not survive translation. Keep the institution name in its own element instead.

## Errors and feedback

Technical failures never reach the interface. `httpErrorInterceptor` converts every failed request
into an `AppError` carrying only a code and an optional support reference, logs the technical detail
through the `Logger` port, and shows a translated alert. Callers that render a failure themselves
opt out per request:

```ts
http.get(url, { context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true) });
```

`AppError` deliberately has no `cause` field, so raw payloads cannot be rendered by accident.

## UI library: Taiga UI

Taiga UI 5.19.0, every package **Apache-2.0**. `@taiga-ui/core` declares `@angular/core >=19.0.0`,
so Angular 22 is supported without forcing peers.

The project was bootstrapped on PrimeNG and moved away from it: PrimeNG 22 verifies a paid PrimeUI
licence at startup and paints an "Invalid PrimeUI License" banner over the application in both
development and production. Its free Community tier explicitly excludes universities and publicly
funded educational institutions, so this project did not qualify. That is the reason for the switch —
do not reintroduce PrimeNG without resolving the licence first.

Built-in library wording (mostly accessibility labels) must follow the user's language. Taiga ships
these in `@taiga-ui/i18n` as language packs, so pick the pack and keep it in step with the build
locale rather than translating them by hand.

**Migration is in progress.** Commit `19eff2a` is the last working PrimeNG state and serves as the
reference for what to replicate. See `CLAUDE.md` §21 for the outstanding checklist — most importantly
the colour-bridge decision, which should be settled before building views.

## Quality gates

- `pnpm lint` — includes `@angular-eslint` template accessibility rules.
- `pnpm test` — **unit tests only** for now. End-to-end, cross-layer integration and systematic
  component tests are deliberately out of scope until the booking flow settles. Existing component
  and integration specs are kept and must keep passing. Test behaviour, not implementation details.
- `pnpm build` — enforces the bundle budget (750 kB warning / 900 kB error on the initial bundle).
  The baseline behind those numbers was measured on PrimeNG; re-measure and recalibrate after the
  Taiga UI migration.

Security review (threat modelling, dependency auditing, input sanitisation) is out of scope for now
and will be picked up before the application is exposed to real users. Three invariants stay in
force regardless, because they are already implemented and covered by tests: no private keys in the
frontend, `AppError` carries no `cause`, and the interceptor logs URLs without their query string.

- `sonar-project.properties` is ready for SonarCloud; fill in `sonar.projectKey` and
  `sonar.organization` before the first analysis.
