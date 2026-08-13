# UnivGo — Frontend

Booking platform for university spaces (sports facilities and study rooms). The application is
built for a single institution today but is deliberately kept tenant-agnostic: identity, wording,
colour and endpoints are all resolved through configuration rather than written into components.

## Requirements

Angular 22 requires Node `^22.22.3 || ^24.15.0 || >=26.0.0` (this is enforced by `engines` in
`package.json`). Older Node releases fail during the CLI's own version check.

```bash
npm install
npm start          # http://localhost:4200 in Spanish
npm run start:en   # the same app served from the English translation
```

## Scripts

| Script                  | Purpose                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `npm start`             | Dev server, source locale (`es`)                                                    |
| `npm run start:en`      | Dev server, English translation — use it to catch layout breaks from longer strings |
| `npm run build`         | Production build, emits `dist/univgo-frontend/browser/{es,en}`                      |
| `npm test`              | Unit and component tests (Vitest + jsdom)                                           |
| `npm run test:coverage` | Same, writing `coverage/univgo-frontend/lcov.info`                                  |
| `npm run lint`          | ESLint, including Angular template accessibility rules                              |
| `npm run format`        | Prettier                                                                            |
| `npm run i18n:extract`  | Refresh `src/locale/messages.xlf` from the source                                   |

## Architecture

Ports and adapters. Dependencies point inwards; nothing in `core/` imports from `features/`.

```
src/app/
  core/          Cross-cutting infrastructure, no business rules
    config/      AppConfig contract + APP_CONFIG token (per-tenant values)
    errors/      Error vocabulary, HTTP mapping, user-facing wording
    http/        Interceptors
    logging/     Logger port + console adapter
    notifications/  Toast feedback, the single entry point for transient messages
    seo/         Route-driven document metadata
    theme/       PrimeNG preset — the source of truth for colour tokens
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

### Component levels

1. **Global** (`layout/`, `shared/`) — used across features, no feature-specific logic.
2. **Feature** (`features/<feature>/presentation/`) — reused within one feature.
3. **View** — used by a single page; extract only when it earns its own file.

Use PrimeNG whenever it offers the component. Write a bespoke component only when PrimeNG has no
equivalent, and say why in the component.

## Design tokens

Colour is defined once, in `core/theme/univgo-theme.preset.ts`. PrimeNG emits that palette as
`--p-*` custom properties, and `tailwindcss-primeui` re-exposes them as Tailwind utilities
(`bg-primary`, `text-surface-600`, …), so components and utility classes can never drift apart.
Retheming for another institution means changing the preset, nothing else.

Non-colour tokens (font stack, radii, shadow, layout sizing, z-index) live in the `@theme` block of
`src/styles.css`. Reach for an existing token before adding a new one, and avoid arbitrary values
where a token exists.

Dark mode is driven by `[data-theme="dark"]` on the root element, matched by both the PrimeNG
config and the Tailwind `dark` variant. No toggle ships yet.

## Internationalisation

`@angular/localize`, with `es` as the source locale and `en` as a translation. Every user-visible
string is marked with an explicit, stable id (`@@feature.element`).

Adding or changing wording:

1. Mark it up — `i18n="@@some.id"` in templates, `` $localize`:@@some.id:Texto` `` in TypeScript.
2. Run `npm run i18n:extract`.
3. Add the matching `<trans-unit>` to `src/locale/messages.en.xlf`.

Production builds set `i18nMissingTranslation: "error"`, so an untranslated string fails the build
rather than silently falling back to Spanish.

Avoid interpolating names into sentences where grammar depends on them (articles, gender) — it does
not survive translation. Keep the institution name in its own element instead.

## Errors and feedback

Technical failures never reach the interface. `httpErrorInterceptor` converts every failed request
into an `AppError` carrying only a code and an optional support reference, logs the technical detail
through the `Logger` port, and shows a translated toast. Callers that render a failure themselves
opt out per request:

```ts
http.get(url, { context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true) });
```

`AppError` deliberately has no `cause` field, so raw payloads cannot be rendered by accident.

## PrimeNG licensing — action required

PrimeNG 22 verifies a **PrimeUI licence** at startup. Without one it logs
`[PrimeUI] PrimeUI license is not configured.` and renders an "Invalid PrimeUI License" banner over
the running application, in development and production alike.

The free Community licence explicitly **excludes universities and publicly funded educational
institutions**, so this project does not qualify on its intended deployment. A Commercial licence is
$599 per developer (perpetual, one year of updates; $799 from 2027).

Once a key is available, set `primeUiLicense` in `src/environments/environment*.ts` — it is read by
`providePrimeNG` in `app.config.ts`. The key is not a secret: it is verified offline on the client
and ships in the bundle regardless.

If a licence is not acquired, the alternative is PrimeNG 21, which carries no licence check — but
its peer range is Angular ^21, so the whole framework would move down one major version.

## Working with PrimeNG components

PrimeNG 22 components no longer accept `styleClass`. Pass `class` instead — it is forwarded to the
component root and merges with the generated PrimeNG classes. `styleClass` is silently ignored,
which fails quietly rather than loudly.

Built-in PrimeNG wording (mostly accessibility labels) defaults to English. Translate the keys you
expose in `core/i18n/primeng-translation.ts` as you adopt more components.

## Quality gates

- `npm run lint` — includes `@angular-eslint` template accessibility rules.
- `npm test` — behaviour-level tests; keep them off implementation details.
- `npm run build` — enforces the bundle budget (750 kB warning / 900 kB error on the initial
  bundle; the current baseline is ~691 kB raw, ~159 kB transferred).
- `sonar-project.properties` is ready for SonarCloud; fill in `sonar.projectKey` and
  `sonar.organization` before the first analysis.
