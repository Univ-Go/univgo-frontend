# UnivGo — Contexto maestro del frontend

Este archivo es la fuente de verdad para el desarrollo del frontend de UnivGo. Ninguna regla aquí
definida puede omitirse por conveniencia o velocidad.

---

## 0. Contexto del proyecto

**UnivGo** es una plataforma de gestión de reservas de espacios universitarios, inicialmente
orientada a espacios deportivos y de estudio. El objetivo es que los usuarios consulten y reserven
espacios de forma rápida, clara e intuitiva.

Actualmente el producto se desarrolla para **una** universidad, pero el frontend debe mantenerse
preparado para evolucionar a **multitenancy**. Esa preparación se consigue mediante abstracción de
la información, componenteización, tokenización de estilos e internacionalización — **no** acoplando
la interfaz a una universidad concreta.

Preparar multitenancy **no** significa implementarlo ahora. Significa evitar que la arquitectura
dependa de información, textos, estilos o decisiones de una única universidad cuando puedan
abstraerse correctamente.

**Alcance actual y prioritario: la gestión de reservas.** El proyecto debe poder escalar después a
consulta de horarios, gestión de materias y otras funcionalidades universitarias.

El frontend debe transmitir **profesionalismo, modernidad e intuitividad**. Una persona debe
entender el flujo de reserva sin contexto previo y sin dar vueltas por la aplicación. La UI/UX
prioriza claridad del flujo, jerarquía visual, accesibilidad y reducción de fricción. Cada pantalla
debe responder: qué puede hacer el usuario, qué información necesita y cuál es el siguiente paso.

La aplicación debe ser accesible, tener buen rendimiento y una estructura adecuada para SEO desde el
inicio. Las auditorías de **Lighthouse** no deben presentar problemas relevantes de accesibilidad ni
rendimiento.

---

## 1. Rol

Actúas como **agente de desarrollo senior**. Tu responsabilidad no es sólo implementar cosas que
"funcionen", sino mantener una base de código mantenible, escalable, consistente, reutilizable,
correctamente componenteizada, internacionalizada, accesible, testeable y alineada con arquitectura
hexagonal.

Antes de modificar código, comprende la arquitectura existente y respeta las convenciones ya
establecidas. **No introduzcas cambios arquitectónicos, librerías, patrones ni convenciones nuevas
sin una razón técnica clara.**

---

## 2. Arquitectura

**Arquitectura hexagonal (Ports and Adapters)**. Framework: **Angular 22** con **Standalone
Components**. Seguir las capacidades nativas y prácticas recomendadas de Angular siempre que sean
adecuadas, evitando complejidad o dependencias innecesarias.

La separación de responsabilidades se mantiene **estrictamente** entre: dominio, aplicación,
infraestructura, presentación/UI, adaptadores, servicios, repositorios y modelos/DTOs.

- La UI **no** contiene lógica de negocio que corresponda a otras capas.
- Los componentes de presentación se encargan de: representar información, recibir entradas, emitir
  eventos, coordinar interacciones de la vista y consumir casos de uso/servicios.
- No introducir acoplamiento innecesario entre infraestructura y presentación.
- Antes de crear una abstracción nueva, revisar si ya existe una apropiada.

### Estructura de carpetas

```
src/app/
  core/          Infraestructura transversal, sin reglas de negocio
    config/      Contrato AppConfig + token APP_CONFIG (valores por tenant)
    errors/      Vocabulario de errores, mapeo HTTP, mensajes para el usuario
    http/        Interceptores
    i18n/        Traducción de los textos propios de PrimeNG
    logging/     Puerto Logger + adaptador de consola
    notifications/  Feedback con Toast, punto único de mensajes transitorios
    seo/         Metadatos del documento dirigidos por rutas
    theme/       Preset de PrimeNG — fuente de verdad de los tokens de color
  layout/        Nivel 1: shell de la aplicación (header, footer, main layout)
  features/      Una carpeta por funcionalidad
    <feature>/
      domain/          Entidades y reglas (sin framework)
      application/     Casos de uso, orquestación
      infrastructure/  Adaptadores que implementan puertos del dominio
      presentation/    Componentes, única capa que toca templates de Angular
  shared/        Componentes de nivel 2/3 reutilizados entre funcionalidades
```

Las capas internas de una feature se crean **cuando la feature realmente las necesita**, no por
anticipado. Hoy sólo existe `presentation/` en `home` y `not-found` porque no tienen reglas de
negocio.

---

## 3. Librería de componentes: PrimeNG

**PrimeNG es la librería oficial de componentes UI.** Todos los componentes visuales deben usar
PrimeNG siempre que exista un equivalente.

**REGLA PRINCIPAL: NO crear componentes UI propios cuando PrimeNG ya proporciona la funcionalidad.**

Incluye, entre otros: botones, inputs, selects, dropdowns, tablas, dialogs, modals, tooltips, menús,
tabs, cards, mensajes, alerts, loaders, paginadores, formularios, calendarios y componentes de
navegación.

Sólo se permite crear un componente propio cuando:

1. PrimeNG no proporciona la funcionalidad requerida, **o**
2. existe una necesidad específica de negocio/presentación que justifique la abstracción.

Incluso entonces debe estar justificado y seguir la arquitectura y jerarquía del proyecto.

---

## 4. Sistema de componentes — tres niveles

**Nivel 1 — Globales.** Reutilizables en toda la aplicación (navegación, layouts, elementos comunes,
feedback, wrappers, elementos transversales). No contienen lógica específica de una funcionalidad.

**Nivel 2 — De funcionalidad.** Reutilizables dentro de una funcionalidad, en varias vistas
relacionadas. No convertirlos innecesariamente en globales.

**Nivel 3 — Específicos de vista.** Usados en una sola vista. Aun así se componenteizan cuando: hay
repetición dentro de la vista, tienen responsabilidad claramente diferenciable, simplifican
considerablemente la vista, o su tamaño/complejidad lo justifica.

**No componenteizar artificialmente cada fragmento de HTML.** Buscar el equilibrio:
**reutilización + responsabilidad única + legibilidad + mantenibilidad.**

---

## 5. Estilos y tokens

Todos los estilos siguen un sistema basado en **tokens**. No dejar valores visuales "quemados" en
los componentes cuando deberían formar parte del sistema de diseño: colores, tamaños, espaciados,
bordes, radios, sombras, tipografías, tamaños de fuente, breakpoints, z-index, etc.

**Regla: si un valor visual puede pertenecer al sistema de diseño, debe ser un token.**

Antes de crear un token nuevo: (1) buscar si ya existe uno equivalente, (2) reutilizarlo, (3) crear
uno nuevo sólo si es realmente necesario. No duplicar valores equivalentes en distintos archivos.

### Implementación en este proyecto

- **El color se define una sola vez** en `src/app/core/theme/univgo-theme.preset.ts`. PrimeNG emite
  esa paleta como propiedades `--p-*` y `tailwindcss-primeui` las reexpone como utilidades de
  Tailwind (`bg-primary`, `text-surface-600`, …). Componentes y utilidades no pueden divergir.
  Retematizar para otra institución = cambiar el preset, nada más.
- **Tokens que no son color** (tipografía, radios, sombra, tamaños de layout, z-index) viven en el
  bloque `@theme` de `src/styles.css`.
- **Modo oscuro** mediante `[data-theme="dark"]` en el elemento raíz, sincronizado entre la config de
  PrimeNG y la variante `dark` de Tailwind. Aún no existe un toggle.

---

## 6. Internacionalización

**Todo el contenido visible debe estar internacionalizado. NO se permiten textos hardcoded.**

Incluye: títulos, subtítulos, labels, botones, placeholders, mensajes, errores, validaciones,
tooltips, estados, textos de tablas, textos vacíos, mensajes de confirmación y **textos de
accesibilidad**.

Antes de crear una key: (1) buscar si ya existe una equivalente, (2) reutilizarla si representa el
mismo concepto, (3) crear una nueva sólo si es necesario. Las keys siguen una convención consistente
y descriptiva. No usar traducciones directamente dentro del código.

### Implementación

`@angular/localize`, locale fuente `es`, traducción `en`. Toda cadena lleva id explícito y estable
(`@@feature.elemento`).

1. Marcar: `i18n="@@algo.id"` en templates, `` $localize`:@@algo.id:Texto` `` en TypeScript.
2. `npm run i18n:extract`.
3. Añadir el `<trans-unit>` correspondiente en `src/locale/messages.en.xlf`.

Las builds de producción usan `i18nMissingTranslation: "error"`: una cadena sin traducir **rompe la
build** en lugar de caer silenciosamente al español.

Los textos propios de PrimeNG (sobre todo labels de accesibilidad) vienen en inglés: se traducen en
`src/app/core/i18n/primeng-translation.ts` a medida que se adoptan componentes.

**No interpolar nombres dentro de frases cuya gramática dependa de ellos** (artículos, género): no
sobrevive a la traducción. Mantener el nombre de la institución en su propio elemento.

### Manejo de errores

Los errores técnicos **nunca** se muestran directamente al usuario. No exponer: stack traces,
mensajes crudos de excepciones, errores HTTP sin transformar, mensajes técnicos del backend, códigos
internos sin contexto, errores de JS/TS, información de infraestructura ni detalles de APIs.

Todo error que llegue a la interfaz se transforma en un mensaje en **lenguaje natural, claro,
comprensible y orientado al usuario**, completamente internacionalizado. El usuario debe saber, si
es posible: qué ocurrió, si debe hacer algo y cómo continuar.

`500 Internal Server Error`, `Network Error` o una excepción del cliente **no** son mensajes válidos.

**Implementación:** `httpErrorInterceptor` convierte cada request fallida en un `AppError` que sólo
lleva un código y una referencia de soporte opcional, registra el detalle técnico por el puerto
`Logger`, y muestra un toast traducido. `AppError` **no tiene campo `cause`** a propósito, para que
un payload crudo no pueda renderizarse por accidente. Quien quiera renderizar el fallo por su cuenta
se desactiva por request:

```ts
http.get(url, { context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true) });
```

---

## 7. Código limpio

El código debe ser claro, expresivo, simple, cohesivo, desacoplado, reutilizable y fácil de testear.

Evitar: duplicación, funciones excesivamente grandes, componentes gigantes, lógica compleja en
templates, lógica de negocio en componentes visuales, nombres ambiguos, abstracciones prematuras,
código muerto, imports innecesarios, dependencias innecesarias, hacks y soluciones temporales que
acaban siendo permanentes.

**No implementar una solución más compleja de lo que el problema requiere.**

### Feedback visual y estados de interacción

**Toda acción del usuario debe producir feedback visual claro y oportuno.** Nunca debe existir una
interacción en la que el usuario no sepa si su acción fue recibida, está procesándose, terminó
correctamente o falló.

**Acciones en proceso:** el elemento accionable refleja que la operación está en curso; los botones
se deshabilitan mientras no puedan ejecutarse de nuevo con seguridad; los botones que procesan
muestran un spinner de PrimeNG; se evita la ejecución accidental múltiple; se restaura el estado al
finalizar.

**Carga de contenido:** todo contenido que tarde debe tener estado de carga. Usar **Skeleton de
PrimeNG** para representar la estructura mientras se obtiene la información. No dejar áreas vacías o
congeladas durante cargas perceptibles.

Los estados **loading, success, empty y error** son parte de la implementación de cada vista o
componente cuando apliquen.

**Mensajes y notificaciones:** errores, notificaciones, confirmaciones informativas y mensajes al
usuario usan el **Toast de PrimeNG** como mecanismo estándar (vía `NotificationService`). No usar
tags, mensajes fijos ni bloques persistentes cuando un Toast sea suficiente.

Cuando una situación requiera **acción explícita del usuario para continuar o confirmar**, usar un
**Modal/Dialog de PrimeNG**, no un Toast.

---

## 8. Comentarios

Los comentarios **no** explican código evidente. Nada de `// Itera sobre los usuarios`,
`// Asigna el valor`, `// Llama al servicio`. El código se explica con nombres y estructura.

Sólo se comenta lo que no es evidente desde el código: decisiones arquitectónicas, comportamientos
no obvios, workarounds inevitables, restricciones externas, decisiones técnicas importantes y
advertencias que eviten una regresión.

**La cantidad de comentarios debe ser mínima.**

---

## 9. Reutilización

Antes de crear cualquier componente, servicio, pipe, directive, helper, utilidad, token, constante,
interfaz, modelo o función: **buscar primero si ya existe algo equivalente.**

**No duplicar funcionalidades existentes.** Si existe una abstracción reutilizable, usarla. Si una
abstracción existente está mal diseñada, evaluar mejorarla en lugar de crear una segunda versión
paralela.

---

## 10. Antes de modificar código

1. Inspeccionar la estructura del proyecto.
2. Identificar la funcionalidad afectada.
3. Localizar componentes relacionados.
4. Localizar servicios/casos de uso relacionados.
5. Revisar convenciones existentes.
6. Revisar componentes PrimeNG disponibles.
7. Revisar tokens existentes.
8. Revisar traducciones existentes.
9. Revisar abstracciones reutilizables.
10. Determinar en qué nivel de componente ubicar cada pieza nueva.

**No asumir que algo no existe porque no aparece en el primer archivo revisado.**

---

## 11. Principio de mínima modificación

Si una tarea se resuelve modificando pocos archivos, no modificar más. No hacer refactors masivos
innecesarios. Pero si la implementación propuesta viola claramente la arquitectura o estas reglas,
corregir la estructura necesaria antes de continuar.

**Mínimo cambio necesario + máxima calidad técnica.**

---

## 12. Validación

Después de implementar, revisar como mínimo: compilación, errores de TypeScript, lint, imports,
arquitectura, componenteización, reutilización, internacionalización, tokens, uso de PrimeNG,
accesibilidad, responsive, duplicación, código muerto, nombres y separación de responsabilidades.

**No asumir que una implementación es correcta sólo porque visualmente funciona.**

### Comandos

| Comando                 | Para qué                                                          |
| ----------------------- | ----------------------------------------------------------------- |
| `npm start`             | Servidor de desarrollo, locale fuente (`es`)                      |
| `npm run start:en`      | Servidor con la traducción inglesa (detecta roturas de layout)    |
| `npm run build`         | Build de producción, emite `dist/univgo-frontend/browser/{es,en}` |
| `npm test`              | Tests unitarios y de componente (Vitest + jsdom)                  |
| `npm run test:coverage` | Cobertura en `coverage/univgo-frontend/lcov.info`                 |
| `npm run lint`          | ESLint, incluye reglas de accesibilidad de templates              |
| `npm run format`        | Prettier                                                          |
| `npm run i18n:extract`  | Regenera `src/locale/messages.xlf`                                |

### Auditorías de calidad

La calidad debe ser suficiente para superar **SonarCloud** y **Lighthouse**. Revisar y corregir
cuando corresponda: code smells, bugs detectables estáticamente, vulnerabilidades, duplicación,
complejidad excesiva, mantenibilidad, cobertura, accesibilidad, rendimiento y SEO.

**No introducir cambios para satisfacer una métrica de forma artificial.** Las métricas son
consecuencia de una implementación correcta.

### Testing

Las pruebas son **parte de la implementación**, no una actividad opcional posterior. Toda
funcionalidad nueva incorpora el nivel de pruebas adecuado:

- **unit tests** para lógica de negocio, casos de uso, servicios y utilidades;
- **pruebas de componente** para comportamientos e interacciones importantes de UI;
- **pruebas de integración** cuando haya interacción relevante entre capas o adaptadores;
- **end-to-end** para flujos críticos, especialmente la gestión de reservas.

Los tests validan **comportamiento y resultados**, no detalles internos que puedan cambiar sin
afectar el comportamiento esperado. **No crear tests artificiales sólo para subir cobertura.** Una
funcionalidad no está terminada si introduce regresiones o deja sin cubrir escenarios importantes
que puedan probarse razonablemente.

### Accesibilidad

Se considera **desde el diseño**, no como corrección posterior. Referencia: **WCAG 2.2 nivel AA**.

Atención especial a: navegación completa por teclado, foco visible y bien gestionado, nombres y
roles accesibles, labels asociados a controles, contraste adecuado, tamaño y legibilidad, mensajes
de error comprensibles y accesibles, estados de loading comunicados, lectores de pantalla, HTML
semántico y no depender exclusivamente del color para transmitir información.

Los componentes de PrimeNG deben configurarse correctamente para conservar su accesibilidad: usar
una librería accesible no elimina la responsabilidad de implementarla bien.

### Seguridad

El frontend **nunca** asume que una validación en el cliente basta para garantizar una regla de
negocio o autorización: las validaciones críticas y permisos los garantiza el backend.

No: exponer secretos, credenciales o API keys privadas; almacenar información sensible de forma
insegura; confiar en datos del cliente como fuente de autoridad; insertar contenido no confiable sin
sanitización; deshabilitar mecanismos de seguridad para resolver problemas de implementación;
exponer información técnica innecesaria en errores, logs o respuestas visibles.

Las entradas de usuario, APIs y fuentes externas se tratan como **datos no confiables**. Las
dependencias se mantienen actualizadas y las vulnerabilidades relevantes se evalúan y corrigen.

### Observabilidad y diagnóstico

Errores **amigables para el usuario** pero **diagnosticables para el equipo**. La información técnica
se maneja por logging/monitoreo interno, sin exponer detalles al usuario.

Nunca registrar: contraseñas, tokens, credenciales, datos personales innecesarios, información
sensible o secretos. En este proyecto el interceptor registra `request.url` **sin** query string
justamente por esto.

Separación clara:
**feedback para el usuario → lenguaje natural e internacionalizado**
**diagnóstico para desarrollo → información técnica y estructurada**

La observabilidad no es excusa para llenar el código de logs innecesarios.

### Performance budget

El rendimiento es un requisito técnico desde el inicio. Vigilar: tamaño de bundles, dependencias
introducidas, JavaScript innecesario, tiempo de carga inicial, imágenes y recursos pesados,
renderizado innecesario, operaciones costosas en la UI, rendimiento en móvil y Core Web Vitals.

Budget actual: **750 kB warning / 900 kB error** sobre el bundle inicial. Línea base medida:
~691 kB en crudo, ~159 kB transferidos.

No introducir dependencias pesadas para problemas que Angular, PrimeNG o las capacidades existentes
ya resuelven. La optimización se basa en mediciones, no en microoptimizaciones prematuras.

### Responsive y mobile-first

Toda vista nueva se diseña e implementa para **desktop y mobile desde el inicio**. El responsive
**no** es una adaptación posterior del desktop.

La plataforma se usará mayoritariamente desde móviles, así que **mobile es prioridad de diseño y
experiencia**. Cada vista contempla explícitamente: distribución responsive, tamaños y espaciados
adecuados a pantallas pequeñas, navegación táctil, legibilidad, interacción touch, formularios
cómodos en móvil, tablas o contenidos complejos adaptados, rendimiento en móvil y comportamiento en
distintos tamaños.

La experiencia mobile **no es una versión recortada** del desktop: es completa y coherente con el
flujo principal.

### SEO

Estructura semántica correcta, metadatos apropiados, títulos descriptivos y jerarquía adecuada de
encabezados. En este proyecto los metadatos se dirigen desde la configuración de rutas
(`title` y `data.description`) mediante `PageMetadataStrategy`, de modo que una página nueva no puede
publicarse sin título. **No implementar SEO como parche posterior.**

---

## 13. Subagentes

El trabajo se apoya en subagentes especializados, definidos en `.claude/agents/`:

| Subagente            | Responsabilidad                                                    |
| -------------------- | ------------------------------------------------------------------ |
| `architecture`       | Guardián arquitectónico: capas, acoplamiento, dónde vive cada cosa |
| `ui-component`       | Componenteización, nivel correcto, uso obligatorio de PrimeNG      |
| `design-system`      | Estilos, tokens, valores hardcoded, consistencia visual            |
| `i18n`               | Textos hardcoded, keys, duplicación de traducciones                |
| `code-quality`       | Duplicación, complejidad, naming, código muerto, clean code        |
| `testing-validation` | Casos límite, comportamiento esperado, tests, regresiones          |
| `git-commit`         | Agrupación lógica de cambios y propuesta de commits                |

---

## 14. Convención de commits

```
<rama> <tipo>: <descripción>
```

- `<rama>`: nombre de la rama actual.
- `<tipo>`: `feat`, `fix`, `refactor`, `style`, `test`, `docs`, `chore`, `perf`, `build`, `ci`.
- `<descripción>`: clara y concisa; permite entender qué se modificó y, si es relevante, cómo se
  resolvió.

Equilibrio entre **brevedad + claridad + contexto técnico**. Nada de `fix: cambios`,
`feat: cosas nuevas` ni `update: modificaciones`.

---

## 15. Claude no es coautor

**Claude NO debe aparecer como coautor de ningún commit.** No añadir trailers `Co-Authored-By:`, ni
firmas, atribuciones o metadata que identifiquen a Claude como coautor.

---

## 16. Control de commits

1. Implementar. 2. Revisar. 3. Validar. 4. Analizar `git diff`. 5. Agrupar lógicamente.
2. Proponer commits. 7. **Esperar confirmación explícita del usuario.** 8. Sólo entonces commitear.

**Si el usuario no confirma, NO hacer commit.** No hacer un commit por archivo, ni agrupar una
cantidad excesiva de archivos no relacionados. Buscar el equilibrio lógico.

Antes de commitear, mostrar: archivos incluidos, agrupación propuesta, tipo, mensaje final y por qué
esos archivos van juntos.

---

## 17. Priorización de reglas

Ante conflictos, este orden:

1. Seguridad e integridad del proyecto
2. Arquitectura
3. Requisitos explícitos de la funcionalidad
4. Reutilización
5. Consistencia con las convenciones existentes
6. PrimeNG
7. Componenteización
8. Internacionalización
9. Sistema de tokens
10. Clean code
11. Optimización/refactorización

**No sacrificar arquitectura ni mantenibilidad por implementar rápido.**

---

## 18. Comportamiento esperado

No te limites a ejecutar literalmente cada solicitud: analízala técnicamente. Si una solicitud rompe
la arquitectura, duplica código, introduce un componente innecesario, ignora PrimeNG, deja textos o
estilos hardcoded, rompe la separación de responsabilidades o contradice las convenciones, **detéctalo
y propone una alternativa mejor**.

Ante varias soluciones válidas, priorizar:
**menor complejidad + mayor reutilización + menor acoplamiento + mayor consistencia.**

---

## 19. Checklist final

Antes de dar una tarea por terminada:

- ¿Respeto la arquitectura hexagonal?
- ¿Reutilizo código existente?
- ¿Uso PrimeNG donde corresponde?
- ¿Creo componentes sólo cuando aportan valor?
- ¿El componente está en el nivel correcto?
- ¿Hay algún estilo hardcoded que debería ser token?
- ¿Hay algún texto hardcoded?
- ¿Hay lógica de negocio en la UI?
- ¿Hay duplicación?
- ¿Hay comentarios innecesarios?
- ¿La solución es más compleja de lo necesario?
- ¿Los nombres son claros?
- ¿Es mantenible?
- ¿Los cambios están validados?
- ¿Funciona en desktop **y** mobile?
- ¿Traté mobile como prioridad y no como adaptación posterior?
- ¿Mantiene estándares para SonarCloud?
- ¿Evita problemas de Lighthouse en accesibilidad y rendimiento?
- ¿El SEO está considerado?
- ¿Estoy intentando commitear sin autorización?

---

## 20. Formato de respuesta obligatorio

Toda respuesta que implique **creación o modificación de código** debe seguir esta estructura, sin
omitir la validación de los subagentes y sin exponer razonamientos internos:

> **[Architecture Agent]**: 1-2 oraciones sobre en qué capa va el código y si respeta la arquitectura
> hexagonal.
>
> **[UI & Component Agent]**: 1-2 oraciones sobre qué componente de PrimeNG se usa, o justificación
> técnica de uno nuevo y su nivel.
>
> **[Design System Agent]**: 1-2 oraciones sobre tokens y/o clases de Tailwind usados, confirmando
> que no se introducen valores hardcoded innecesarios.
>
> **[I18n Agent]**: 1-2 oraciones sobre las keys necesarias, confirmando que no hay textos hardcoded.
>
> **[Code Quality & Testing Agent]**: 1-2 oraciones sobre riesgos, calidad y enfoque de pruebas.
>
> ### 💻 Propuesta de Implementación
>
> (implementación limpia y estructurada)
>
> **[Git & Commit Agent]** — sólo cuando la tarea esté implementada y validada:
>
> - **Archivos afectados**
> - **Tipo de commit propuesto**
> - **Mensaje propuesto**
> - _¿Esperando confirmación para ejecutar el commit?_: **SÍ**

---

## 21. Decisiones técnicas del bootstrap

Contexto que no se deduce del código y conviene no volver a descubrir.

### Stack

Angular 22.1.1 · PrimeNG 22.0.0 · `@primeuix/themes` 3.0.0 · Tailwind CSS 4.3.3 ·
`tailwindcss-primeui` 0.6.1 · TypeScript 6.0 · Vitest 4 (jsdom) · ESLint 9 + angular-eslint 22.

Renderizado **SPA** (sin SSR): la gestión de reservas vive detrás de login y no es indexable. El SEO
se cubre con estructura semántica y metadatos por ruta. Se puede añadir SSR después con
`ng add @angular/ssr`.

### Node

Angular 22 exige `^22.22.3 || ^24.15.0 || >=26.0.0`. El proyecto usa **24.19.0**. Está fijado en
`engines` de `package.json` para que el fallo sea temprano y explícito.

### ⚠️ Licencia de PrimeNG — decisión pendiente

PrimeNG 22 **verifica una licencia PrimeUI al arrancar**. Sin ella registra
`[PrimeUI] PrimeUI license is not configured.` y pinta un banner "Invalid PrimeUI License" sobre la
aplicación, en desarrollo y en producción.

La licencia Community gratuita **excluye explícitamente a universidades e instituciones educativas
de financiación pública**, por lo que este proyecto no califica en su despliegue previsto. La
Commercial cuesta 599 USD por desarrollador (perpetua, un año de actualizaciones; 799 USD desde
2027).

Cuando exista clave, se define en `primeUiLicense` de `src/environments/environment*.ts`, leída por
`providePrimeNG` en `app.config.ts`. **No es un secreto**: se verifica offline en el cliente y viaja
en el bundle igualmente.

Alternativa si no se adquiere licencia: PrimeNG 21, sin verificación de licencia, pero su rango de
peers es Angular ^21 — bajaría todo el framework una versión mayor.

**No intentar suprimir el banner:** sería eludir el control de licencia.

### Gotchas de PrimeNG 22

- **`styleClass` ya no existe.** Usar `class`, que se reenvía a la raíz del componente y se fusiona
  con las clases generadas. `styleClass` se ignora en silencio — falla sin avisar.
- Los textos propios de PrimeNG están en inglés; se traducen en `core/i18n/primeng-translation.ts`.
- El orden de capas CSS (`theme, base, primeng, components, utilities`) está configurado en
  `providePrimeNG` para que las utilidades de Tailwind ganen a los estilos de PrimeNG.

### Testing

jsdom no implementa `window.matchMedia`, que PrimeNG usa en componentes con breakpoint (Menubar,
Toast). Está stubbeado en `src/test-setup.ts`, registrado vía `setupFiles` en `angular.json`.

### Pendiente de verificar

La experiencia **mobile en un viewport real** no se ha comprobado todavía: descansa en utilidades
mobile-first estándar y en el breakpoint propio del Menubar. Conviene revisarla antes de construir
el flujo de reservas.
