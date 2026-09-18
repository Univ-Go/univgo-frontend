# De maqueta a demo funcional

Dónde está el paso de la maqueta —vistas completas sobre datos inventados— a una demo que habla con
el backend de verdad. Existe para responder tres preguntas sin tener que leer el código: **qué ya
funciona de punta a punta, qué sigue siendo maqueta, y qué se rompió o se quedó a medias por el
camino.**

**Última verificación: 2026-09-17.** Rama `DEMO`, en los dos repositorios. Lo de aquí se comprobó
ejecutando la aplicación contra el backend, no leyendo el código.

`booking-flow.md` manda sobre qué debe hacer el producto y `database.md` sobre qué hay en la base.
Este fichero no repite ninguno de los dos: sólo dice por dónde va la implementación.

---

## 1. El estado en una tabla

Los pasos son los de `booking-flow.md` §5 y §11.

| Paso                                | Estado   | Qué lo sostiene                                                      |
| ----------------------------------- | -------- | -------------------------------------------------------------------- |
| Iniciar sesión                      | **Real** | `POST /auth/login`, cookies, refresco y guards                       |
| Catálogo de espacios                | **Real** | `GET /spaces?date=`                                                  |
| Elegir día y bloque                 | **Real** | `GET /spaces/{id}/availability?date=`                                |
| Confirmar la reserva                | **Real** | `POST /reservations`, con el aviso de último minuto                  |
| Ver el código de acceso             | **Real** | El código del servidor, dibujado como QR escaneable                  |
| Mis reservas y su detalle           | **Real** | `GET /reservations/me` y `GET /reservations/{id}`                    |
| Cancelar una reserva                | **Real** | `POST /reservations/{id}/cancel`                                     |
| Panel: elegir espacio               | **Real** | `GET /spaces`, el mismo catálogo del estudiante                      |
| Panel: escanear el check-in         | **Real** | `POST /admin/checkin/scan` con el bloque en curso                    |
| Panel: bloques del día y su detalle | **Real** | `GET /admin/spaces/{id}/blocks` y `/blocks/{hora}`                   |
| Panel: cierres y mantenimiento      | Mixto    | Mantenimiento y cancelación masiva reales; el registro de cierres no |

**El backend está completo para todo el flujo.** Lo que falta es cablear el frontend: de los catorce
endpoints que publica para las reservas —sin contar los de sesión ni los de usuarios— hoy se llaman
once. Los tres que quedan son el listado de reservas del administrador y las dos mitades de la
configuración de la institución, que ninguna vista pide todavía.

---

## 2. Lo que ya es real

**Sesión.** Login con credenciales de la base, sesión en cookies que el navegador gestiona, refresco
silencioso desde el interceptor y comprobación en cada cambio de vista. Los guards separan estudiante
de administrador.

**Catálogo.** `SpaceRepository` (puerto en `spaces/domain`) con su adaptador HTTP. El catálogo se lee
**un día cada vez**, porque es lo que el servidor puede responder: un espacio llega con los bloques
que todavía tienen plaza ese día. Buscar, filtrar por categoría y por hora siguen siendo cosa del
navegador sobre esa respuesta.

**Disponibilidad.** El paso de día y bloque lee los bloques reales, y cada uno que no se puede tomar
dice por qué: completo, ya reservaste aquí hoy, se cruza con otra reserva, ya no da tiempo. Esa
lectura es `blockerOf`, una función pura en `spaces/domain/space-block.ts`.

**Reservas del estudiante.** `ReservationRepository` (puerto en `my-reservations/domain`) cubre las
cuatro operaciones de su lado: crearla, listarlas, abrir una y cancelarla. Vive con la funcionalidad
que las lee y las conserva; `booking` es un llamador de `create`, igual que lo es del catálogo.

La respuesta del servidor sólo trae el `spaceId`, así que el adaptador **une cada reserva con el
catálogo** para darle nombre, ubicación y categoría. La unión está en el adaptador a propósito: es la
forma de la API, no una regla, y el día que la respuesta traiga el espacio consigo cambia un fichero.

**Los cinco estados llegan tal cual.** `reserved`, `in_progress`, `finished`, `expired` y
`cancelled` se traducen a la vista sin colapsarse: expirada y cancelada se distinguen en el texto y
en el icono, que es justo lo que `booking-flow.md` §7 pide. El estado lo calcula el servidor con su
reloj en cada lectura; el frontend no lo deriva por su cuenta en ningún sitio.

**El aviso de último minuto.** `previewCheckInOpensAt` / `previewCheckInClosesAt` ya viajan hasta el
paso 3. Que una reserva sea de último minuto se lee de la propia respuesta —el check-in abre después
de que el bloque empezara sólo si se reservó ya empezado—, no del reloj del navegador.

**Estados de carga y error.** Las vistas que piden datos tienen esqueleto de Taiga mientras cargan y
un estado de error con reintento. «Todavía no tienes reservas» y «no hay reservas con estos filtros»
son estados distintos, porque lo que se puede hacer a continuación es distinto.

**El panel elige entre espacios reales.** La rejilla de entrada, el selector de la cabecera y el
guard de `:spaceId` leen el catálogo por el mismo puerto que el estudiante, a través de
`AdminSpacesStore`, que lo retiene durante la sesión: un directorio de espacios no cambia mientras
alguien escanea en una puerta, y sin esa caché serían tres peticiones para abrir el panel. Los ids
de las URLs del panel son ya los UUID de la base, que es lo que hacía falta para que el escáner
pueda comprobar algo.

**El escáner responde de verdad.** `POST /admin/checkin/scan` con el código y —cuando lo hay— el
bloque en curso del espacio, que el panel obtiene de `GET /admin/spaces/{id}/blocks`. Los seis
veredictos vienen del servidor: es quien tiene el reloj, la tolerancia y la escritura que convierte
un escaneo en check-in. La lógica que el frontend tenía para decidirlos (`evaluateCheckInScan`) se
retiró: era una segunda opinión sobre algo que no le corresponde.

**Los bloques del día y su detalle son los del servidor.** La lista lee `GET
/admin/spaces/{id}/blocks` —aforo, ocupadas y libres por bloque— y el detalle añade el listado de
quién lo ocupa: nombre, documento, escuela, estado y hora de entrada. Son dos lecturas porque
cuestan distinto: una lista de siete filas no necesita siete listados de personas.

Un bloque terminado deja de tener plazas ocupadas —eso es «liberar una plaza es una consecuencia»— y
por eso su fila ya no dibuja un medidor a cero: dice que terminó y manda al detalle, que es donde
consta quién se presentó. El listado tampoco ofrece ya un botón de «registrar entrada»: el servidor
hace check-in con un código, y una lista de nombres no lo tiene.

**El espacio se puede retirar del servicio, y sus reservas cancelarse.** `PUT
/admin/spaces/{id}/maintenance` y `POST /admin/spaces/{id}/reservations/cancel-all`, que son las dos
cosas que `booking-flow.md` §10 y §11 piden y las dos únicas que el servidor sabe hacer con un
espacio. Están separadas a propósito: anunciar el cierre de la semana que viene no debe vaciar hoy,
y devolver un espacio al servicio no tiene nada que deshacer. El interruptor no guarda el estado —lo
relee del catálogo después de escribir— así que una escritura fallida deja el control enseñando lo
que es verdad, no lo que se pidió.

**El pase es escaneable.** El QR se genera en el navegador a partir del `qrCodeData` de la reserva
con `qrcode-generator` (~10 kB, sin dependencias), dibujado como un solo `path` SVG que escala del
tamaño de la tarjeta al del diálogo sin una segunda copia. Es la única pareja de colores del
producto que no sigue el tema —`--univgo-qr-ink` sobre `--univgo-qr-paper`, oscuro sobre claro en
ambos modos— porque un QR invertido hay lectores que lo rechazan. La lectura ya estaba: el panel usa
`qr-scanner`, que también viaja aparte.

**Cancelar pide confirmación.** Diálogo de Taiga, no alerta: la plaza vuelve al bloque en ese mismo
instante y no hay vuelta atrás. Después la lista se relee en lugar de parchearse, porque el estado lo
decide el reloj del servidor.

### Lo que hubo que cambiar en el backend

- **`V11`**: `spaces.location` y `space_types.category`. El catálogo no podía decir de qué tipo era
  un espacio ni dónde estaba.
- **El catálogo devuelve `freeBlockStarts`** en lugar de un `hasFreeBlockToday`. Contesta las dos
  mitades de la pregunta —si queda sitio y desde qué hora— con un solo valor en vez de dos que pueden
  desmentirse.
- **`GET /spaces` acepta `?date=`**. Antes siempre respondía sobre hoy.
- **El escaneo exige `spaceId`** y responde «otro bloque» si la reserva es de otro espacio. Antes
  buscaba sólo por código, así que un QR de otro espacio se daba por bueno en la puerta equivocada.
- **`V12`/`V13`: `users.school`**, y el listado de un bloque devuelve **documento y escuela** además
  del nombre. Sin eso, quien está en la puerta no podía contrastar el carné con la lista.

---

## 3. Lo que sigue siendo maqueta

Un fichero, y dice a quién sostiene:

| Fichero                                 | Sostiene                                                    |
| --------------------------------------- | ----------------------------------------------------------- |
| `admin/infrastructure/mock-closures.ts` | El registro de cierres: formulario, historial e indicadores |

**El registro de cierres no tiene API que lo sostenga.** El formulario guarda alcance, motivo,
recurrencia y quién lo autorizó, y el servidor guarda un booleano por espacio. No es cableado
pendiente: es una funcionalidad que el backend no tiene. O crece una tabla de cierres, o esa mitad
de la vista se retira y se queda con el interruptor y la cancelación, que ya son reales.

**El lado del estudiante ya no tiene ninguno.** El pase enseña el `qrCodeData` real de la reserva,
como código y como QR, y el escáner del panel lo comprueba contra el servidor: el ciclo se cierra
sin teclear nada.

---

## 4. Deuda técnica

Por impacto, no por orden de aparición.

### 4.1 La base está a 95 ms de aquí

Medido: ~95 ms de ida y vuelta a Neon (`us-east-2`) desde esta máquina. Es el suelo de **cada**
consulta, así que el coste de un endpoint es su número de consultas × 95 ms.

El catálogo bajó de 8,2 s a 0,55 s cuando dejó de preguntar bloque a bloque, pero esos 0,55 s son
cuatro consultas contra el mismo suelo, no un límite del código. Y el suelo también marca la
concurrencia: cada petición del catálogo consume cuatro × 95 ms de conexión, así que con las diez
de Hikari el techo son ~26 peticiones por segundo antes de que empiecen a hacer cola.

Lo que lo cambia de orden de magnitud es **acercar la base al backend**, no optimizar más consultas.
Lo que sí queda por hacer en el código: cachear `institution_config` —una fila que sólo cambia por el
`PUT` del administrador— y unir espacios y horarios en una sola consulta. Dos idas y vueltas menos,
~0,2 s.

### 4.2 Los parámetros del flujo están dos veces

`booking-flow.md` §3 dice que bloque, tolerancia, uso mínimo y reservas por día son configuración de
la institución. Están en `institution_config` en la base **y** como `BOOKING_DURATION_MINUTES = 120`
en `spaces/domain/space.ts`. Hoy coinciden; nada garantiza que sigan coincidiendo.

Queda un consumidor menos: la reserva ya no calcula su hora de fin sumando el bloque, la toma del
`blockEnd` que responde el servidor. La constante sólo la usa el catálogo, para cerrar la ventana de
cada `freeBlockStart` —que es una lista de inicios, sin fin— y así decir «libre a las diez».

El endpoint que los publica, `GET /admin/institution-config`, es sólo para administradores, así que
el frontend no puede leerlos aunque quiera. O se expone una lectura pública de los que el estudiante
necesita, o el número del frontend queda documentado como copia y alguien lo vigila.

### 4.3 Un test del backend falla según la hora

`CheckInReservationServiceTest.validScanChecksInAStillReservedReservation` construye su bloque como
«ahora − 1 min, dos horas». Después de las ~21:45 eso se pasa de medianoche, `LocalTime` da la vuelta
y la reserva no se puede ni construir. El comentario del test dice «regardless of wall-clock time»,
y no es verdad.

Es anterior a este trabajo y no lo arregla ningún cambio de test: el servicio lee
`LocalDateTime.now()` por su cuenta. El arreglo es inyectarle un `Clock`, como pide
`booking-flow.md` §14 —«el ahora es un parámetro»— que hoy sólo se cumple en
`ReservationTimingCalculator`.

### 4.4 Datos que hacen parecer roto lo que funciona

- **«Gimnasio de Pesas» no tiene horarios.** Es el espacio anterior a la `V5`, que sólo sembró
  horarios para sus cinco canchas. Sin horario no hay bloques, así que ese espacio dice «no abre este
  día» los siete días. Falta una `V12` con sus horas reales.
- **Las seis ubicaciones son la misma cadena**, `Complejo Deportivo Central`, que la `V11` puso como
  marcador de posición para poder imponer `NOT NULL`. Buscar por ubicación no distingue nada.
- **Los seis espacios son de la misma categoría.** El agrupador del catálogo enseña un solo grupo.

Ninguno es un fallo de código, y los tres se ven como si lo fueran.

### 4.5 Cabos sueltos del frontend

- **Cada vista pide su propio catálogo, y ahora también cada lectura de reservas.** Como la respuesta
  de `/reservations` sólo trae el `spaceId`, el adaptador pide el catálogo para ponerle nombre: abrir
  Inicio son dos peticiones, y Mis reservas otras dos. Se arregla por cualquiera de los dos lados —una
  caché del catálogo en el frontend, o el nombre del espacio en la respuesta del backend— y la segunda
  es la que ahorra la ida y vuelta entera.
- **El código de acceso es un UUID, y no debería serlo.** `qr_code_data` se genera como
  `UUID.randomUUID()`, así que lo que el estudiante enseña —y lo que hay que teclear cuando el
  escáner falla— son 36 caracteres hexadecimales. Dentro de un QR da igual; leído en voz alta en un
  mostrador, o escrito a mano, es justo el caso en que el código de respaldo tiene que servir. **Lo
  ideal es un código corto y legible generado por el backend** —del estilo `UG-4F7K`, sin vocales
  para que no forme palabras ni se confunda `O` con `0`— único por reserva y con el UUID detrás si
  hace falta. Es un cambio de backend: el frontend ya sólo enseña lo que el servidor emite.
- **«Otro bloque» dice dos cosas a la vez.** El servidor contesta el mismo veredicto cuando la
  reserva es de otra hora y cuando es de otro espacio, así que el panel no puede distinguirlas y su
  mensaje se queda en la hora de la reserva. Un veredicto propio para «otro espacio» —o el id del
  espacio en la respuesta— dejaría decir «esa reserva es de la cancha 2».
- **La lista del día no puede contar la asistencia de un bloque pasado.** El resumen cuenta plazas
  ocupadas _ahora_, y un bloque terminado no ocupa ninguna, así que la fila remite al detalle. Si el
  resumen llevara «asistieron» y «no se presentaron», la lista volvería a decirlo de un vistazo.
- **Abrir un bloque cuesta dos peticiones**: la lista del día —que es lo que valida la hora de la
  URL y alimenta el selector— y el detalle con su listado.
- **El filtro «disponible a las» cambió de significado.** Ofrece horas cada media hora, pero ahora
  los bloques son fijos: pedir las 14:30 nunca encaja con el bloque de 14:00 y siempre responde «más
  tarde». Es correcto, y el control sugiere lo contrario. Debería ofrecer los inicios de bloque.
- **El budget de bundle sigue sin recalibrar**, con los dos problemas que `CLAUDE.md` §12 ya
  describe: los dos paquetes de idioma de Taiga viajan en cada build y `@angular/forms` acaba en el
  inicial.
- **Mobile no se ha probado en un viewport real.** Las vistas se construyeron responsive, pero la
  comprobación sigue pendiente desde el bootstrap.

### 4.6 Tres agujeros que el cierre de espacios destapa

`booking-flow.md` §12 define ahora qué es cerrar un espacio y qué pasa con las reservas que caen
dentro. Dos de estas tres cosas no esperan a eso: fallan hoy.

**El panel no sabe que un espacio está fuera de servicio.** `GetSpaceDayBlocksService` no mira
`under_maintenance`, así que con el interruptor puesto el catálogo del estudiante deja de ofrecer
bloques y la consulta del panel los sigue mostrando disponibles, con su aforo y todo. Es el fallo más
visible de los tres: invita a contar con plazas que no existen.

**El estudiante no sabe quién canceló su reserva, ni por qué.** `reservations.cancelled_by` existe
desde la `V9` y se rellena bien —`STUDENT` cuando cancela él, `ADMIN` cuando el panel cancela en
bloque—, pero `ReservationResponse` no lo devuelve. Una cancelación suya y una de la universidad se
leen igual: «Cancelada» y nada más. El motivo no existe en ninguna parte todavía; llega con el
cierre, que es lo único que puede aportarlo.

**El cierre de un espacio no se registra.** La mitad de `/admin/:id/settings` que lo pide sigue
siendo maqueta, y ahora tiene especificación: §12 dice que un cierre **suspende y no cancela**,
porque si cancelara no habría vuelta atrás que dar.

### 4.7 Fuera de foco, anotado a propósito

Seguridad (`CLAUDE.md` §12) sigue fuera de foco salvo sus tres invariantes, que se mantienen. Los
trece permisos de `role_permissions` siguen sembrados y sin comprobarse: la autorización es sólo por
rol. Y no hay tests de componente ni end-to-end, que es lo acordado hasta que el flujo esté estable.

---

## 5. Por dónde seguir

**El flujo está cableado de punta a punta**: una reserva creada en el móvil se conserva enseñando su
QR en el mostrador, y el panel la ve aparecer en el listado del bloque con el documento y la escuela
de quien entró. Lo que queda no es cableado, es funcionalidad que el backend todavía no tiene.

**El cierre de espacios**, que es lo que queda, y está decidido: un cierre suspende y se puede
revertir (`booking-flow.md` §12). Lo que el frontend necesita del backend para cablearlo, en el
orden en que desbloquea:

1. **`cancelledBy` en `ReservationResponse`** —y `cancellationReason` cuando exista— para que la
   reserva cancelada diga quién la canceló. La columna ya está; es exponerla.
2. **`closed` y su motivo en el resumen de un bloque**, y que el resumen deje de ignorar
   `under_maintenance`. Sin esto la consulta del panel miente aunque no haya cierres.
3. **`space_closures`** y sus endpoints: listar, crear y revertir. Un cierre es espacio, desde
   cuándo, hasta cuándo —vacío si es indefinido—, motivo, detalle, quién lo registró y cuándo se
   revirtió.
4. **El estado `suspended`** en la reserva y el veredicto **«cerrado»** en el escaneo. Es lo que
   evita que una reserva expire por una puerta que estaba cerrada.
5. **El interruptor de mantenimiento pasa a ser un cierre sin fecha de fin**, y el booleano
   desaparece. Mientras convivan los dos, seguirán diciendo cosas distintas.

Del lado del frontend, cuando eso exista: el formulario de cierres cablea contra 3, el historial
muestra los revertidos, la fila del bloque se marca cerrada con 2, y la reserva del estudiante
explica su cancelación con 1. La recurrencia del formulario se retira: §12 la deja fuera.

De la deuda, lo que conviene no dejar para después: **4.4** (los datos, porque es lo que se ve en
una demostración) y **4.2** (los parámetros duplicados, porque cada vista nueva que los lea
multiplica el problema).
