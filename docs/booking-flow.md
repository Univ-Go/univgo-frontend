# Flujo de reserva

Fuente de verdad del flujo de reserva de UnivGo. Define cómo un estudiante reserva un espacio, cómo
lo conserva y cómo el sistema devuelve la plaza cuando no aparece.

Este documento manda sobre la implementación: si el código y este fichero no coinciden, el código
está mal. `CLAUDE.md` §22 lleva el resumen operativo —parámetros, fórmulas e invariantes— y apunta
aquí para todo lo demás.

**Alcance actual:** gimnasio y espacios con aforo. **Estado:** definición cerrada, pendiente de
implementar. **Siguiente entrega:** panel de administrador.

---

## 1. El problema que resuelve

Un espacio reservado y no usado es un espacio perdido dos veces: nadie lo aprovechó y alguien se
quedó sin él.

El riesgo de cualquier sistema de reservas es que la plaza quede bloqueada por alguien que no se
presenta. Este flujo lo ataca por un solo sitio: **reservar no basta, hay que aparecer**. Si el
estudiante no hace el check-in dentro de una ventana corta, su reserva se cierra y la plaza vuelve
al aforo del bloque de inmediato, sin esperar a que termine el horario.

A cambio, el sistema es más generoso que lo que había antes: se puede reservar con antelación, se
puede cancelar sin coste y —esto es nuevo— **se puede reservar un bloque que ya empezó**,
recuperando plazas que antes se habrían perdido.

**No hay confirmación previa.** Pedirle a un estudiante que confirme su reserva dos horas antes
exige un canal para avisarle, y hoy la plataforma no tiene ninguno: cancelar la reserva de alguien
que nunca recibió el aviso sería perder la plaza y al usuario. El check-in cumple la misma función,
en el momento en que sí importa.

---

## 2. Vocabulario

| Término                      | Significado                                                                                                                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bloque**                   | Franja fija de **2 horas** dentro del horario de apertura de un espacio: 08:00–10:00, 10:00–12:00, 14:00–16:00… Los bloques no se solapan y el estudiante no elige hora de inicio, elige un bloque. |
| **Aforo**                    | Cuántos estudiantes admite un espacio **por bloque**. Es política de la institución: «al gimnasio pueden entrar 30 estudiantes por cada bloque de 2 horas».                                         |
| **Plaza**                    | Una de esas posiciones del aforo. Una reserva ocupa exactamente una plaza de un bloque concreto.                                                                                                    |
| **Check-in**                 | El momento en que un administrador escanea el código del estudiante y el sistema da la reserva por usada. Es lo único que la conserva.                                                              |
| **Reserva de último minuto** | La que se crea **cuando el bloque ya empezó**. Se define por la hora en que se crea, no por lo que ocurrió antes con la plaza.                                                                      |

Un espacio de uso exclusivo —una cancha, un laboratorio— no necesita reglas aparte: es **aforo 1**.
El mismo modelo cubre los dos casos sin ramas, y por eso este documento habla siempre de plazas y
nunca de «espacio libre u ocupado».

---

## 3. Parámetros

Todo el comportamiento sale de estos números. Son configuración de la institución (`APP_CONFIG`), no
reglas escritas en el dominio: cambiarlos no debe exigir tocar el producto.

| Parámetro                  | Valor       | Qué gobierna                                                                                                                       |
| -------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Duración del bloque        | 120 min     | La rejilla de bloques de todos los espacios.                                                                                       |
| Tolerancia de check-in     | 15 min      | Cuánto antes del inicio se puede entrar, y cuánto margen hay después para no perder la reserva. Un solo número para las dos cosas. |
| Uso mínimo garantizado     | 75 min      | Cuánto tiempo de bloque debe quedar para que la plaza siga ofreciéndose.                                                           |
| Reservas por espacio y día | 1           | Cuántas veces al día puede un mismo estudiante reservar el mismo espacio.                                                          |
| Aforo                      | por espacio | Cuántas plazas ofrece cada bloque de ese espacio.                                                                                  |

---

## 4. Reglas de reserva

**Una reserva por espacio y día.** No se puede reservar el gimnasio dos veces el mismo día. Sí se
pueden reservar espacios distintos el mismo día.

**Nunca dos reservas que se solapen.** Dos reservas del mismo estudiante no pueden compartir ni un
minuto, aunque sean de espacios diferentes: una reserva de 14:00 a 16:00 impide otra de 13:00 a
15:00, porque una persona no puede estar en dos sitios a la vez. Espacios con horarios de apertura
distintos tienen rejillas de bloques distintas, así que el solape es posible y hay que comprobarlo
siempre.

**El bloque debe tener plazas libres.** Si el aforo está completo, el bloque no se ofrece. No hay
lista de espera.

**Y debe quedar tiempo suficiente.** Un bloque en curso sólo se ofrece mientras quede margen para
cumplir el uso mínimo:

```
último instante para reservar un bloque = fin del bloque − uso mínimo − tolerancia

bloque 14:00–16:00 → 16:00 − 1:15 − 0:15 = 14:30
```

A partir de las 14:30 ese bloque desaparece del catálogo aunque le queden plazas libres. El
siguiente bloque, 16:00, se ofrece con normalidad.

---

## 5. Los tres pasos

Reservar es siempre lo mismo, se haga con tres días de antelación o con el bloque ya empezado. La
única diferencia es el aviso que aparece en el paso 3.

1. **Elegir el espacio.** El catálogo, con buscador y filtros. Cada espacio muestra si tiene plazas
   hoy y a qué hora.
2. **Elegir el día y el bloque.** Una tira de días y una rejilla de bloques de dos horas. Cada
   bloque indica las plazas que le quedan; los completos se ven, marcados como completos.
3. **Revisar y confirmar.** Espacio, día, bloque, normas del espacio y —si el bloque ya empezó— la
   hora límite para presentarse.

Al confirmar, la reserva queda creada y el estudiante recibe su **código de acceso**: un QR con su
equivalente en texto por si el escáner falla.

El aviso de «debes presentarte antes de las 14:37» va **antes de confirmar**, no después. Cambia el
trato —estás comprando menos tiempo y te obligas a estar allí enseguida— y enterarse después de
aceptar sería una trampa.

---

## 6. Check-in

El estudiante llega al espacio y enseña su código. El administrador lo escanea desde su panel. Ese
escaneo es el check-in: la reserva pasa a estar **en curso** y ya no puede perderse.

La ventana tiene apertura y cierre, y ambos salen de los mismos dos parámetros:

```
abre  = máx( inicio del bloque − tolerancia , hora de creación )
cierra = mín( máx( inicio del bloque , hora de creación ) + tolerancia , fin del bloque − uso mínimo )
```

Para el bloque 14:00–16:00:

| Reserva creada      | Abre  | Cierra | Por qué                                                           |
| ------------------- | ----- | ------ | ----------------------------------------------------------------- |
| Ayer, o esta mañana | 13:45 | 14:15  | Reserva normal: quince minutos antes, quince después.             |
| 14:22               | 14:22 | 14:37  | Último minuto: quince minutos desde que reservó.                  |
| 14:30               | 14:30 | 14:45  | El último caso posible. Le quedan las 1:15 de uso mínimo exactas. |

Pasado el cierre sin escanear, la reserva **expira** por sí sola. Nadie tiene que hacer nada para
que ocurra: es el reloj.

Las tres marcas que gobiernan el flujo son **14:00** (inicio), **14:30** (último instante para
reservar) y **14:45** (tope absoluto de check-in). Las 14:15 son sólo el cierre del caso anticipado.

---

## 7. Estados de una reserva

Cinco estados. Sólo tres transiciones dependen de una persona —crearla, cancelarla y escanearla—;
las demás las hace el reloj.

```
reserved ──check-in──▶ in_progress ──fin del bloque──▶ completed
   │
   ├──vence el check-in──▶ expired
   └──el estudiante cancela──▶ cancelled
```

| Estado        | Qué ve el estudiante                             | ¿Ocupa plaza? | ¿Gasta la reserva del día? |
| ------------- | ------------------------------------------------ | ------------- | -------------------------- |
| `reserved`    | Su código y la cuenta atrás hasta el check-in.   | Sí            | Sí                         |
| `in_progress` | Que ya está dentro, y a qué hora termina.        | Sí            | Sí                         |
| `completed`   | Historial.                                       | No            | Sí                         |
| `expired`     | Que no llegó a tiempo y por eso perdió la plaza. | No            | Sí                         |
| `cancelled`   | Que la canceló él.                               | No            | No                         |

**Por qué `expired` y no `cancelled`.** Son dos cosas distintas para el estudiante, y ese es el
motivo de separarlas: una la decidió él, la otra le ocurrió. Ver «expirada» le explica por qué
perdió la plaza sin tener que preguntar. Para el espacio, en cambio, son idénticas: la plaza vuelve
al aforo y da igual el motivo. El estado queda registrado además para poder añadir penalizaciones
más adelante.

**La única diferencia con consecuencias: cancelar devuelve la reserva del día; expirar no.** Quien
avisa puede volver a reservar más tarde; quien no aparece ya usó su reserva de gimnasio de hoy. No
es una sanción añadida: es que la reserva se hizo y se consumió. De paso, cierra la puerta a que
alguien retenga plazas reservando una y otra vez sin presentarse nunca.

---

## 8. Aforo y liberación de plazas

El espacio no sabe nada de estados de reserva. Sólo cuenta:

```
plazas libres de un bloque = aforo − reservas reserved − reservas in_progress
```

De ahí sale lo importante: **liberar una plaza no es una acción, es una consecuencia**. Cuando una
reserva expira o se cancela deja de contar, y en ese mismo instante el bloque tiene una plaza más.
No hay ningún proceso que «devuelva cupos», ningún estado especial en el espacio, y nada que pueda
quedarse a medias.

Con un gimnasio de treinta plazas esto pasa desapercibido la mayoría de los días: siempre sobran
plazas y liberar una no cambia nada. Donde importa es en los bloques que se llenan —las horas
punta— que son exactamente aquellos en los que perder una plaza duele.

---

## 9. Reserva de último minuto

Un bloque que ya empezó se sigue ofreciendo mientras tenga plazas y quede tiempo suficiente. Da
igual por qué hay plazas: puede que nadie llenara el bloque, o puede que alguien acabe de expirar.
Es la misma regla, y por eso no existe ningún estado de «plaza recuperada».

Ejemplo — bloque 14:00–16:00, aforo 30, completo desde ayer:

| Hora  | Qué ocurre                                                           | Plazas libres |
| ----- | -------------------------------------------------------------------- | ------------- |
| 13:45 | Abre el check-in. Empiezan a entrar estudiantes.                     | 0             |
| 14:15 | Cierra el check-in. Ana no apareció: su reserva expira.              | 1             |
| 14:15 | El bloque vuelve a aparecer en el catálogo, con 1 plaza.             | 1             |
| 14:22 | Luis lo reserva. El paso 3 le avisa: debe entrar antes de las 14:37. | 0             |
| 14:24 | Luis llega y el administrador escanea su código. Reserva en curso.   | 0             |
| 16:00 | Termina el bloque. Las reservas en curso se dan por finalizadas.     | 30            |

Si Luis no hubiera aparecido a las 14:37, su reserva habría expirado y la plaza habría vuelto a
estar libre… pero ya serían más de las 14:30, así que el bloque no se ofrecería a nadie más. Esa
plaza se pierde, y es el límite consciente del sistema: se recuperan las plazas mientras quede
tiempo de usarlas de verdad.

---

## 10. Casos límite

| Situación                                         | Comportamiento                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| El bloque está completo                           | Se muestra como completo, no se puede seleccionar. Sin lista de espera.                     |
| Ya reservó ese espacio hoy                        | Los bloques de ese espacio aparecen bloqueados, explicando que ya tiene su reserva del día. |
| El bloque se solapa con otra reserva suya         | Bloqueado, indicando con qué reserva choca.                                                 |
| Cancela antes de que empiece el bloque            | La plaza se libera y recupera su reserva del día.                                           |
| Cancela con el bloque empezado, sin haber entrado | Igual: plaza liberada y reserva del día recuperada.                                         |
| Quiere cancelar estando dentro                    | No se puede: una reserva en curso ya se está usando. Termina sola al acabar el bloque.      |
| Llega tarde, cuando su reserva ya expiró          | El escaneo falla y le dice que expiró. No puede volver a reservar ese espacio hoy. Ver §11. |
| Intenta entrar antes de que abra el check-in      | El escaneo indica que aún es pronto y a partir de qué hora es válido.                       |
| Enseña un código ya usado                         | El escaneo indica que esa reserva ya está en curso, con la hora del check-in.               |
| El espacio está en mantenimiento                  | No ofrece bloques. Las reservas existentes deben cancelarse desde el panel.                 |
| El QR no escanea                                  | El estudiante enseña el código en texto y el administrador lo introduce a mano.             |

---

## 11. Qué necesita el panel de administrador

El check-in vive en el panel, así que el flujo sólo se sostiene si el administrador tiene estas
cuatro cosas.

**Escanear.** La pantalla principal y casi la única: cámara apuntando a un código, o un campo para
teclearlo. Cada escaneo tiene que dar una respuesta inequívoca a un metro de distancia y con alguien
esperando:

- **Válida** — nombre del estudiante y hora de fin. Check-in registrado.
- **Aún no** — el check-in abre a las 13:45.
- **Expirada** — venció a las 14:15.
- **Ya usada** — entró a las 13:52.
- **Otro bloque** — su reserva es de 16:00 a 18:00.
- **No existe** — código desconocido o cancelado.

**Ver el bloque actual.** Aforo, plazas ocupadas, plazas libres y la lista de estudiantes con su
estado. Es lo que permite responder «¿queda sitio?» sin escanear nada.

**Consultar otros bloques.** Los del día, para responder preguntas y preparar el turno siguiente.

**Cancelar reservas del espacio.** Para mantenimiento imprevisto, cierre anticipado o incidencias.

### Decisión pendiente

**¿Puede el administrador dejar entrar a alguien cuya reserva expiró?** Tal como está definido, no:
el estudiante que llega a las 14:20 se queda fuera aunque haya veinticinco plazas libres, y ya no
puede reservar de nuevo hoy. Es coherente, pero es el caso que más reclamaciones va a generar en el
mostrador. Un «registrar entrada manualmente», con el motivo anotado, sería la válvula de escape
natural — conviene decidirlo con la universidad antes de construir el panel.

---

## 12. Fuera de alcance

Decisiones tomadas a conciencia, no olvidos. Casi todas cuelgan de lo mismo: **hoy no hay forma de
notificar a un estudiante** fuera de la propia aplicación.

| No entra                  | Motivo                                                                                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Confirmación previa       | Exige avisar con antelación. Sin canal de notificación, cancelaría reservas de gente que nunca supo que debía confirmar.                                             |
| Lista de espera           | Mismo motivo: una plaza que se libera a las 14:15 no le sirve a nadie que no esté mirando la aplicación en ese momento.                                              |
| Recordatorios             | Mismo motivo.                                                                                                                                                        |
| Penalizaciones acumuladas | El estado `expired` queda registrado para poder añadirlas después. Hoy la única consecuencia es perder la reserva del día.                                           |
| Salida anticipada         | Con bloques de dos horas, quien se va antes deja un resto que casi nadie podría aprovechar, y añade trabajo al administrador. La reserva termina sola con el bloque. |
| Que el estudiante escanee | Un código fijo en la puerta se fotografía y se comparte. El check-in lo hace el administrador.                                                                       |

---

## 13. Notas técnicas

**El estado se calcula, no se guarda.** `expired` y `completed` no las provoca nadie: son el
resultado de comparar el reloj con dos marcas de tiempo. Se calculan con una función pura a la que
se le pasa el instante actual, en lugar de programar tareas que reescriban filas. No hace falta
ningún planificador, y las pruebas quedan deterministas porque el «ahora» es un parámetro.

**La autoridad es el servidor.** El reloj del móvil no es de fiar y la liberación de una plaza
afecta a otras personas, así que la verdad vive en el backend. El frontend deriva de esas marcas lo
que la pantalla necesita —cuenta atrás, habilitar el botón, pasar a expirada en el momento exacto—
para no quedarse congelado entre consultas. El check-in se revalida en el servidor al escanearse,
pase lo que pase en pantalla.

### Qué cambia respecto a lo que ya está construido

- `BOOKING_DURATION_MINUTES` y `BOOKING_START_STEP_MINUTES` pasan de `60` a `120`.
- Los horarios de apertura (`Space.freeSlots`) dejan de ser ventanas continuas y se dividen en
  bloques fijos de dos horas.
- `SpaceAvailability` deja de ser «libre / ocupado» y pasa a ser un recuento de plazas por bloque.
- El catálogo tiene que ofrecer bloques ya empezados, que hoy no aparecen.
- `ReservationStatus` pasa de `upcoming | ongoing | past` a los cinco estados de §7; los tres
  antiguos son presentación derivada, no datos.
- Los parámetros de §3 van a `APP_CONFIG`, no al dominio.

---

## Mantenimiento de este documento

Este fichero es el original. La versión que se le presenta al cliente es un artifact publicado —una
representación de este contenido, no una fuente paralela— y se republica sobre la misma URL cuando
esto cambie. Un solo sitio que editar.
