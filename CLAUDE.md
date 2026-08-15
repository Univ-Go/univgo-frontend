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
    i18n/        Idioma de los textos propios de Taiga UI
    logging/     Puerto Logger + adaptador de consola
    notifications/  Punto único de mensajes transitorios (alertas)
    seo/         Metadatos del documento dirigidos por rutas
    theme/       Tema y paleta de marca
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

## 3. Librería de componentes: Taiga UI

**Taiga UI es la librería oficial de componentes UI.** Todos los componentes visuales deben usar
Taiga UI siempre que exista un equivalente.

**REGLA PRINCIPAL: NO crear componentes UI propios cuando Taiga UI ya proporciona la funcionalidad.**

Incluye, entre otros: botones, inputs, selects, dropdowns, tablas, dialogs, modals, tooltips, menús,
tabs, cards, mensajes, alerts, loaders, paginadores, formularios, calendarios y componentes de
navegación.

Sólo se permite crear un componente propio cuando:

1. Taiga UI no proporciona la funcionalidad requerida, **o**
2. existe una necesidad específica de negocio/presentación que justifique la abstracción.

Incluso entonces debe estar justificado y seguir la arquitectura y jerarquía del proyecto.

Paquetes: `@taiga-ui/core`, `@taiga-ui/cdk`, `@taiga-ui/kit`, `@taiga-ui/layout`, `@taiga-ui/icons`,
`@taiga-ui/styles`, `@taiga-ui/i18n`. Todos **Apache-2.0** — sin licencia de pago, sin banner, sin
restricción para instituciones educativas.

### Basarse siempre en la documentación oficial

**Toda decisión sobre el uso de la librería se apoya en <https://taiga-ui.dev>, no en memoria ni en
analogías con otras librerías.** Antes de usar un componente, una directiva, un token de inyección o
un mecanismo de tematización: consultar cómo lo documenta Taiga y seguirlo.

Esto vale también para los estilos: se hace lo que recomienda la documentación, no lo que sería el
equivalente en PrimeNG, Angular Material o Tailwind. Si una API no aparece documentada, verificarla
contra los tipos de `node_modules/@taiga-ui/*` antes de usarla; no dar por hecha una firma.

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

### Sin Tailwind. El sistema de estilos es el de Taiga UI

**Tailwind sale del proyecto.** Nada de clases utilitarias. Los estilos se escriben en **SCSS**
siguiendo el mecanismo que documenta Taiga UI, que es el único sistema de diseño del proyecto. Esto
evita mantener dos fuentes de verdad y elimina la clase de bug donde una utilidad y un componente
resuelven a colores distintos.

Los cuatro mecanismos oficiales, en orden de preferencia:

1. **Variables CSS globales** de los temas claro y oscuro. Es la vía principal para el color: se
   sobrescriben las variables de la paleta de Taiga con los valores de marca. Referencia de nombres:
   la `palette.less` de la librería y <https://taiga-ui.dev/colors>.
2. **Mixins de LESS/SCSS de la librería** para construir apariencias nuevas, en lugar de replicar
   estilos a mano.
3. **Tokens de configuración e inyección de señales**, incluido `TUI_DARK_MODE` para el modo oscuro.
4. **Sobrescritura de clases de estilo** sobre elementos o componentes, local o globalmente. Es el
   último recurso, no el primero.

### Reglas

- **No inventar un sistema paralelo.** Antes de crear una variable propia, comprobar si Taiga ya
  define el token: color, tipografía (<https://taiga-ui.dev/typography>), espaciado, radios y sombras
  vienen cubiertos. Sólo se crean variables propias para conceptos que Taiga no tenga (por ejemplo,
  anchos de layout específicos del producto), y viven en un único fichero.
- **Nada de valores visuales quemados en los componentes.** Ni colores, ni tamaños, ni espaciados,
  ni radios, ni sombras, ni z-index. Si puede pertenecer al sistema de diseño, es una variable.
- **El color de marca se define una sola vez.** Retematizar para otra institución debe seguir siendo
  cambiar ese punto único, nada más. Es lo que sostiene la preparación para multitenancy.

### Modo oscuro

`TUI_DARK_MODE` es un `WritableSignal<boolean>` inyectable, con método `reset()`. Se inicializa solo
desde `localStorage` o desde `prefers-color-scheme`, y persiste los cambios manuales. Para aplicar un
tema a una rama concreta del DOM existe la directiva `tuiTheme`.

No hay que construir nada de esto a mano: usar lo que trae la librería.

### Paleta de marca

Decidida y reutilizable: escala 50→950 con primario `#2544eb`. Vive en
`src/app/core/theme/_univgo-theme.scss`, traducida a las variables de acento y de acción de Taiga
para los temas claro y oscuro. Es el punto único que hay que tocar para retematizar.

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
2. `pnpm i18n:extract`.
3. Añadir el `<trans-unit>` correspondiente en `src/locale/messages.en.xlf`.

Las builds de producción usan `i18nMissingTranslation: "error"`: una cadena sin traducir **rompe la
build** en lugar de caer silenciosamente al español.

Los textos propios de la librería (sobre todo labels de accesibilidad) también deben quedar en el
idioma del usuario. Taiga UI los distribuye en `@taiga-ui/i18n` con paquetes de idioma, así que en
lugar de traducirlos a mano hay que **seleccionar el idioma correcto y mantenerlo sincronizado con el
locale de la build**. Esto sustituye a `core/i18n/primeng-translation.ts`, que desaparece.

Verificar que `@taiga-ui/i18n` incluye español; si alguna cadena concreta falta o no encaja, se
sobreescribe puntualmente, no se traduce el paquete entero.

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
muestran el indicador de carga de Taiga UI; se evita la ejecución accidental múltiple; se restaura el
estado al finalizar.

**Carga de contenido:** todo contenido que tarde debe tener estado de carga. Usar el **skeleton de
Taiga UI** para representar la estructura mientras se obtiene la información. No dejar áreas vacías o
congeladas durante cargas perceptibles.

Los estados **loading, success, empty y error** son parte de la implementación de cada vista o
componente cuando apliquen.

**Mensajes y notificaciones:** errores, notificaciones, confirmaciones informativas y mensajes al
usuario usan el **sistema de alertas de Taiga UI** como mecanismo estándar, siempre a través de
`NotificationService`. No usar tags, mensajes fijos ni bloques persistentes cuando una alerta
transitoria sea suficiente.

`NotificationService` (`core/notifications/`) sobrevivió a la migración: su API pública —`success`,
`info`, `warn`, `error(AppError)`— no cambió. Por dentro habla con `TuiNotificationService`; sus
tests comprueban el mismo comportamiento contra la nueva librería.

Cuando una situación requiera **acción explícita del usuario para continuar o confirmar**, usar un
**Dialog de Taiga UI**, no una alerta transitoria.

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
6. Revisar componentes Taiga UI disponibles.
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
arquitectura, componenteización, reutilización, internacionalización, tokens, uso de Taiga UI,
accesibilidad, responsive, duplicación, código muerto, nombres y separación de responsabilidades.

**No asumir que una implementación es correcta sólo porque visualmente funciona.**

### Comandos

| Comando              | Para qué                                                          |
| -------------------- | ----------------------------------------------------------------- |
| `pnpm start`         | Servidor de desarrollo, locale fuente (`es`)                      |
| `pnpm start:en`      | Servidor con la traducción inglesa (detecta roturas de layout)    |
| `pnpm build`         | Build de producción, emite `dist/univgo-frontend/browser/{es,en}` |
| `pnpm test`          | Tests unitarios y de componente (Vitest + jsdom)                  |
| `pnpm test:coverage` | Cobertura en `coverage/univgo-frontend/lcov.info`                 |
| `pnpm lint`          | ESLint, incluye reglas de accesibilidad de templates              |
| `pnpm format`        | Prettier                                                          |
| `pnpm i18n:extract`  | Regenera `src/locale/messages.xlf`                                |

### Auditorías de calidad

La calidad debe ser suficiente para superar **SonarCloud** y **Lighthouse**. Revisar y corregir
cuando corresponda: code smells, bugs detectables estáticamente, duplicación, complejidad excesiva,
mantenibilidad, cobertura, accesibilidad, rendimiento y SEO.

Sonar seguirá marcando vulnerabilidades por su cuenta. No es obligatorio perseguirlas mientras la
seguridad esté fuera de foco, pero tampoco se silencian: se anotan y se dejan para la revisión de
seguridad posterior.

**No introducir cambios para satisfacer una métrica de forma artificial.** Las métricas son
consecuencia de una implementación correcta.

### Testing

**Alcance actual: sólo tests unitarios.** Lógica de negocio, casos de uso, servicios, utilidades y
mapeos. Es lo único exigible para dar una funcionalidad por terminada.

**Fuera de foco por ahora** (no implementar salvo petición explícita): end-to-end, pruebas de
integración entre capas y pruebas de componente sistemáticas. Se retomarán cuando el flujo de
reservas esté estable; el candidato natural para e2e es ese flujo.

Los tests que **ya existen** se conservan y deben seguir pasando, incluido el de integración de
metadatos (`page-metadata.strategy.spec.ts`). Están escritos, pasan y cuestan poco: borrarlos sería
perder trabajo, no reducir alcance. `app-header.spec.ts` se fue con su componente al retirar las
vistas del bootstrap; sus tres comprobaciones —nombre de institución desde `APP_CONFIG`, landmark
`banner`, navegación con nombre accesible— son el criterio a recuperar cuando exista el header real.

Los tests validan **comportamiento y resultados**, no detalles internos que puedan cambiar sin
afectar el comportamiento esperado. **No crear tests artificiales sólo para subir cobertura.** Una
funcionalidad no está terminada si introduce regresiones.

### Accesibilidad

Se considera **desde el diseño**, no como corrección posterior. Referencia: **WCAG 2.2 nivel AA**.

Atención especial a: navegación completa por teclado, foco visible y bien gestionado, nombres y
roles accesibles, labels asociados a controles, contraste adecuado, tamaño y legibilidad, mensajes
de error comprensibles y accesibles, estados de loading comunicados, lectores de pantalla, HTML
semántico y no depender exclusivamente del color para transmitir información.

Los componentes de Taiga UI deben configurarse correctamente para conservar su accesibilidad: usar
una librería accesible no elimina la responsabilidad de implementarla bien.

### Seguridad — fuera de foco, salvo tres invariantes

La revisión sistemática de seguridad (modelado de amenazas, auditoría de dependencias, sanitización
de entradas, política de almacenamiento) **queda fuera del foco actual**. Se retomará antes de
exponer la aplicación a usuarios reales.

Lo que sí sigue vigente, porque ya está implementado y hay tests que lo sostienen. Romperlo es una
regresión, no una despriorización:

1. **No exponer secretos ni API keys privadas** en el frontend.
2. **`AppError` no lleva `cause`.** Ningún payload crudo del servidor puede renderizarse por
   accidente.
3. **El interceptor registra `request.url` sin query string.** Las cadenas de consulta pueden llevar
   tokens o datos personales.

Y una premisa que no cuesta nada mantener: el frontend nunca asume que una validación en el cliente
garantiza una regla de negocio o una autorización. Eso lo garantiza el backend.

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

Budget en `angular.json`: **500 kB warning / 650 kB error** sobre el bundle inicial. ⚠️ Calibrado
sobre la línea base de Taiga **sin ninguna vista** (~424 kB en crudo, ~100 kB transferidos), así que
el margen es headroom para construirlas, no una medida de nada. **Remedir y ajustar** cuando el
flujo de reservas exista: un budget que nunca se acerca al límite no detecta regresiones.

No introducir dependencias pesadas para problemas que Angular, Taiga UI o las capacidades existentes
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
| `ui-component`       | Componenteización, nivel correcto, uso obligatorio de Taiga UI     |
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
6. Taiga UI
7. Componenteización
8. Internacionalización
9. Sistema de tokens
10. Clean code
11. Optimización/refactorización

**No sacrificar arquitectura ni mantenibilidad por implementar rápido.**

---

## 18. Comportamiento esperado

No te limites a ejecutar literalmente cada solicitud: analízala técnicamente. Si una solicitud rompe
la arquitectura, duplica código, introduce un componente innecesario, ignora Taiga UI, deja textos o
estilos hardcoded, rompe la separación de responsabilidades o contradice las convenciones, **detéctalo
y propone una alternativa mejor**.

Ante varias soluciones válidas, priorizar:
**menor complejidad + mayor reutilización + menor acoplamiento + mayor consistencia.**

---

## 19. Checklist final

Antes de dar una tarea por terminada:

- ¿Respeto la arquitectura hexagonal?
- ¿Reutilizo código existente?
- ¿Uso Taiga UI donde corresponde?
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
- ¿La lógica nueva tiene tests unitarios?
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
> **[UI & Component Agent]**: 1-2 oraciones sobre qué componente de Taiga UI se usa, o justificación
> técnica de uno nuevo y su nivel.
>
> **[Design System Agent]**: 1-2 oraciones sobre las variables y mixins de Taiga usados, confirmando
> que no se introducen valores visuales hardcoded.
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

Angular 22.1.x · Taiga UI 5.19.0 · SCSS · TypeScript 6.0 · Vitest 4 (jsdom) ·
ESLint 9 + angular-eslint 22. **Sin Tailwind.** `less` está sólo como dependencia de desarrollo,
para compilar el fichero de tema que distribuye Taiga; los estilos propios se escriben en SCSS.

Compatibilidad verificada: `@taiga-ui/core` 5.19.0 declara `@angular/core >=19.0.0`, así que
Angular 22 entra sin forzar peers.

Renderizado **SPA** (sin SSR): la gestión de reservas vive detrás de login y no es indexable. El SEO
se cubre con estructura semántica y metadatos por ruta. Se puede añadir SSR después con
`ng add @angular/ssr`.

### Node

Angular 22 exige `^22.22.3 || ^24.15.0 || >=26.0.0`. El proyecto usa **24.19.0**. Está fijado en
`engines` de `package.json` para que el fallo sea temprano y explícito.

### Gestor de paquetes: pnpm

**pnpm**, fijado en `packageManager` de `package.json` y en `cli.packageManager` de `angular.json`.
El único lockfile válido es `pnpm-lock.yaml`.

Matiz sobre el pin: **pnpm sí respeta `packageManager`** y se niega a ejecutarse si el campo nombra
otro gestor (comprobado). **npm no lo respeta**; hoy falla aquí sólo de rebote, al no entender el
`node_modules` de pnpm. Para que el pin sea vinculante de verdad hay que habilitar Corepack una vez
por máquina (`corepack enable`). Sin eso, el campo es documentación, no una barrera.

Se migró desde npm por dos propiedades concretas, no por preferencia:

1. **Ningún paquete puede ejecutar scripts de instalación.** `pnpm-workspace.yaml` fija
   `onlyBuiltDependencies: []`. Un paquete transitivo comprometido no ejecuta código sólo por
   instalarse. Se verificó que build, tests y lint funcionan con la lista vacía: esbuild resuelve su
   binario por dependencia opcional según plataforma, y `lmdb`/`msgpackr-extract`/`@parcel/watcher`
   caen a JS o a prebuilds.
2. **`node_modules` estricto:** no existen dependencias fantasma. Todo lo que el código importa está
   declarado en `package.json`.

Si alguna vez una build falla por los scripts bloqueados, añade **ese paquete concreto** a
`onlyBuiltDependencies`. **Nunca** ejecutes `pnpm approve-builds` aceptando la lista entera: eso
anula la principal defensa de cadena de suministro del proyecto.

El registro es el mismo que el de npm, así que esto no protege frente a un paquete malicioso
publicado — protege frente a que se ejecute solo al instalarlo.

### Por qué Taiga UI y no PrimeNG

El bootstrap se hizo con PrimeNG 22 y hubo que abandonarlo: **verifica una licencia PrimeUI al
arrancar** y, sin ella, pinta un banner "Invalid PrimeUI License" sobre la aplicación en desarrollo
y en producción. La licencia Community gratuita **excluye explícitamente a universidades e
instituciones educativas de financiación pública**, así que este proyecto no calificaba; la
Commercial cuesta 599 USD por desarrollador.

Taiga UI es **Apache-2.0** en todos sus paquetes: sin verificación, sin banner, sin restricción por
tipo de institución. El motivo del cambio es ese, no una preferencia estética.

No reintroducir PrimeNG sin resolver primero la licencia.

### Estado de la migración a Taiga UI

**La migración de infraestructura está hecha. Falta construir las vistas.** El commit `19eff2a` es
el último estado con PrimeNG funcionando, por si hace falta consultar cómo estaba resuelto algo.

Se eliminaron las vistas desechables del bootstrap (`home-page`, `not-found-page`, `app-header`,
`app-footer` y `main-layout`, junto con `app-header.spec.ts`), así que **`app.routes.ts` está vacío
y la aplicación arranca sin ninguna página**. Ese es el punto de partida esperado: las vistas
definitivas se construyen desde cero. Lo que se conserva como criterio, no como HTML, es el marcado
semántico: landmarks, jerarquía de encabezados, skip link y `aria-label`.

Cómo quedó montada la librería, que es lo que no conviene volver a deducir:

- **Providers.** `provideTaiga()` en `app.config.ts`. No es opcional: aporta `TUI_OPTIONS` —sin él
  la aplicación no arranca—, registra los plugins de evento que necesitan las plantillas de la
  librería (`click.prevent`, `scroll.zoneless`…) y refleja `TUI_DARK_MODE` sobre el atributo
  `tuiTheme` del `body`. **El modo oscuro no hay que cablearlo a mano.**
- **`tui-root`.** `App` envuelve el `router-outlet` en `<tui-root>`, que aloja los portales
  (alertas, diálogos, dropdowns). Fuera de él, esos componentes no tienen dónde renderizarse.
- **Estilos.** `angular.json` carga `node_modules/@taiga-ui/styles/taiga-ui-theme.less` y después
  `src/styles.scss`. El orden importa: nuestras sobrescrituras de marca sólo ganan si van detrás.
  La marca vive en `src/app/core/theme/_univgo-theme.scss` y se aplica reproduciendo el reparto de
  Taiga entre `@media screen` y `@media print`.
- **`less` es dependencia de desarrollo** por ese `.less`: sin ella el build falla con "Unable to
  load the less stylesheet preprocessor". No es una vuelta a LESS como lenguaje de estilos.
- **Iconos.** Se copian de `node_modules/@taiga-ui/icons/src` a `assets/taiga-ui/icons`, que es
  donde `TUI_ASSETS_PATH` los busca por defecto. Se copia el paquete entero y una vez por locale;
  si algún día pesa, es un candidato claro a recortar.
- **Idioma de la librería.** `provideTaigaLanguage()` elige el paquete de `@taiga-ui/i18n` según
  `LOCALE_ID`, es decir, según el locale con el que se compiló la build. No puede desincronizarse.
- **Alertas.** `NotificationService` habla con `TuiNotificationService`. En Taiga 5 no hay un
  "alert service" único: `TuiNotificationService` (core) para avisos, `TuiToastService` y
  `TuiPushService` (kit) para los otros formatos. Las apariencias son `info`, `positive`,
  `negative`, `warning` y `neutral`.
- **Budget recalibrado** a 500 kB warning / 650 kB error sobre una línea base **sin vistas** de
  ~424 kB en crudo / ~100 kB transferidos. Hay que volver a medirlo cuando existan las vistas
  reales: hoy el margen es headroom para construirlas, no una medida de nada.

Lo que **no** cambió: arquitectura y capas, `AppError` con su mapeo y sus mensajes, `Logger`,
`APP_CONFIG`, `PageMetadataStrategy`, la configuración de i18n, los valores de la paleta de marca,
la configuración de pnpm y las reglas de calidad.

Las cadenas de i18n se podaron con las vistas: quedan las 19 de `error.*`, que describen
situaciones y no vistas. Las de `home.*`, `notFound.*`, `navigation.*`, `layout.*` y `footer.*` se
retiraron de `messages.en.xlf` junto con el código que las usaba — están en el historial si sirven
de referencia, pero las vistas nuevas definen sus propias keys. El criterio de redacción (lenguaje
natural, accionable, sin tecnicismos) se mantiene.

### Testing

jsdom no implementa `window.matchMedia`. Está stubbeado en `src/test-setup.ts`, registrado vía
`setupFiles` en `angular.json`. **Taiga lo necesita:** `TUI_BREAKPOINT` resuelve el layout actual a
partir de él y `TUI_DARK_MODE` lee `prefers-color-scheme`. No lo retires. jsdom puede carecer de
otras APIs del navegador (`ResizeObserver`, `IntersectionObserver`) que Taiga sí use:
`src/test-setup.ts` es el sitio donde añadirlas.

### Pendiente de verificar

La experiencia **mobile en un viewport real** no se ha comprobado todavía. No hay vistas que probar:
toca contemplarla al construirlas, no después.
