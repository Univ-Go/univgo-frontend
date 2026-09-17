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

| Paso                                | Estado   | Qué lo sostiene                                     |
| ----------------------------------- | -------- | --------------------------------------------------- |
| Iniciar sesión                      | **Real** | `POST /auth/login`, cookies, refresco y guards      |
| Catálogo de espacios                | **Real** | `GET /spaces?date=`                                 |
| Elegir día y bloque                 | **Real** | `GET /spaces/{id}/availability?date=`               |
| Confirmar la reserva                | **Real** | `POST /reservations`, con el aviso de último minuto |
| Ver el código de acceso             | Mixto    | El código es el del servidor; el QR sigue dibujado  |
| Mis reservas y su detalle           | **Real** | `GET /reservations/me` y `GET /reservations/{id}`   |
| Cancelar una reserva                | **Real** | `POST /reservations/{id}/cancel`                    |
| Panel: elegir espacio               | Maqueta  | Perfiles de espacio inventados                      |
| Panel: escanear el check-in         | Maqueta  | `POST /admin/checkin/scan` existe                   |
| Panel: bloques del día y su detalle | Maqueta  | `GET /admin/spaces/{id}/blocks` existe              |
| Panel: cierres y mantenimiento      | Maqueta  | `PUT /admin/spaces/{id}/maintenance` existe         |

**El backend está completo para todo el flujo.** Lo que falta es cablear el frontend: de los catorce
endpoints que publica para las reservas —sin contar los de sesión ni los de usuarios— hoy se llaman
ocho. Los seis que quedan son todos del panel: los bloques de un día, el detalle de uno, el
mantenimiento de un espacio y la cancelación masiva.

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

---

## 3. Lo que sigue siendo maqueta

Dos ficheros, los dos del panel, y cada uno dice a quién sostiene:

| Fichero                                   | Sostiene                                         |
| ----------------------------------------- | ------------------------------------------------ |
| `admin/infrastructure/mock-attendance.ts` | Quién ocupa cada bloque: el listado y su detalle |
| `admin/infrastructure/mock-closures.ts`   | Los cierres de la vista de ajustes               |

**Lo que queda inventado del panel son las personas, no los espacios.** Los bloques que dibujan la
consulta del día y su detalle se generan sobre el espacio real —su id, su nombre y su aforo vienen
del catálogo— y lo que se fabrica es quién está dentro. Cablearlo tiene una decisión de producto
delante, y está en la deuda 4.7.

**El lado del estudiante ya no tiene ninguno.** Lo único que sigue dibujado ahí es el **QR**: el
código que hay debajo es el `qrCodeData` real de la reserva —el que el escáner del panel comprobará—
pero la imagen es un marcador de posición. Generarlo exige una librería y sólo sirve cuando el
escáner sea real, así que entra con el paso 4.

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
`booking-flow.md` §13 —«el ahora es un parámetro»— que hoy sólo se cumple en
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
- **El QR es un dibujo.** El código de debajo es real; la imagen no. Va con el paso 4, que es cuando
  hay algo que escanee.
- **Los códigos inventados del panel ya no se cruzan con los reales.** El escáner comprueba contra
  el servidor, así que los `UG-1234` que el listado de un bloque sigue fabricando no valen para
  nada: escanear uno responde «no existe», que es la verdad. Se van con la deuda 4.7.
- **El filtro «disponible a las» cambió de significado.** Ofrece horas cada media hora, pero ahora
  los bloques son fijos: pedir las 14:30 nunca encaja con el bloque de 14:00 y siempre responde «más
  tarde». Es correcto, y el control sugiere lo contrario. Debería ofrecer los inicios de bloque.
- **El budget de bundle sigue sin recalibrar**, con los dos problemas que `CLAUDE.md` §12 ya
  describe: los dos paquetes de idioma de Taiga viajan en cada build y `@angular/forms` acaba en el
  inicial.
- **Mobile no se ha probado en un viewport real.** Las vistas se construyeron responsive, pero la
  comprobación sigue pendiente desde el bootstrap.

### 4.6 El escaneo no comprueba el espacio

`POST /admin/checkin/scan` busca la reserva **por el código y nada más**. El espacio que el
administrador tiene abierto no viaja en la petición y el servidor no lo mira: un código de otro
espacio, con su bloque a la misma hora, se da por bueno y queda con check-in hecho donde no era.

Lo único que hoy lo acota es el bloque: el panel manda `expectedBlockStart` / `expectedBlockEnd` del
bloque en curso, así que una reserva de otra hora responde «otro bloque». A la misma hora, en otro
espacio, no hay nada que lo distinga.

El arreglo es del backend —aceptar el `spaceId` y contestar que la reserva es de otro espacio— y es
pequeño. Se anota aquí, y no se disimula en el frontend: comprobarlo en el navegador sería una regla
de negocio en el sitio donde `CLAUDE.md` §12 dice que no vale ponerla.

### 4.7 El listado de un bloque enseña más de lo que el servidor sabe

La consulta de bloques y su detalle muestran, por cada persona: nombre, facultad, documento, código
de check-in, estado y horas de su ventana. `GET /admin/spaces/{id}/blocks/{start}` devuelve
**nombre, estado y hora de entrada**, y nada más.

Son dos caminos y hay que elegir antes de cablearlo: o el backend publica lo que falta —facultad y
documento salen de `users`, el código es el `qr_code_data` que ya tiene— o el panel se queda con las
tres columnas que el servidor sí contesta y pierde el buscador por documento. No es trabajo de
cableado, es una decisión de producto.

### 4.8 Fuera de foco, anotado a propósito

Seguridad (`CLAUDE.md` §12) sigue fuera de foco salvo sus tres invariantes, que se mantienen. Los
trece permisos de `role_permissions` siguen sembrados y sin comprobarse: la autorización es sólo por
rol. Y no hay tests de componente ni end-to-end, que es lo acordado hasta que el flujo esté estable.

---

## 5. Por dónde seguir

El orden no es de gusto: cada paso desbloquea al siguiente. Lo que estaba primero —crear la reserva,
el lado del estudiante, el selector de espacios del panel y el escáner— está hecho: **una reserva
creada en el móvil ya se conserva escaneándola en el mostrador**.

1. **El QR de verdad en el pase del estudiante.** Es lo único que falta para que el ciclo se cierre
   sin teclear: hoy el código real hay que escribirlo a mano en el escáner.
2. **Decidir la 4.7** y, con eso resuelto, cablear la consulta de bloques y su detalle.
3. **Ajustes del espacio**: mantenimiento y cancelación masiva tienen endpoint; el historial de
   cierres no existe en el backend, así que esa mitad de la vista se queda o se retira.

De la deuda, lo que conviene no dejar para después: **4.6** (el escaneo no mira el espacio, y es un
agujero funcional, no una molestia), **4.2** (los parámetros duplicados, porque cada vista nueva que
los lea multiplica el problema) y **4.4** (los datos, porque es lo que se ve en una demostración).
