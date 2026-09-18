# Estado de la base de datos

Retrato de la base que sirve al backend (`../univgo-backend`). Existe porque su historial de
migraciones **no** se deduce leyendo `db/migration`: la base es anterior a Flyway y arrastra
decisiones que cuestan medio día de redescubrir.

**Última verificación: 2026-09-16.** Todo lo de aquí se comprobó consultando la base, no leyendo el
código. `CLAUDE.md` §23 obliga a actualizar este fichero cuando el esquema o los datos cambien.

---

## 1. Dónde vive

**Neon**, PostgreSQL **18.6**, región `us-east-2`, base `neondb`, `sslmode=require`.

Las credenciales están en `univgo-backend/src/main/resources/application-local.yml`, que **no** está
versionado (hay una plantilla en `application-local.yml.example`). El perfil `local` las lee de ahí,
así que las variables `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` de `application.yml` sólo hacen falta
fuera de desarrollo. El `.env` de la raíz es un resto de la versión NestJS anterior: **nada lo lee**.

**Es una base compartida, no local.** Cualquier migración destructiva afecta a todo el equipo.

---

## 2. Historial de migraciones — lo que no se deduce del repo

Flyway hizo **baseline en la versión 1**. `V1__init.sql` describe el esquema original con claves
`BIGSERIAL`, pero **nunca se ejecutó contra esta base**: se adoptó Flyway sobre un esquema que ya
existía, creado por el TypeORM de la versión NestJS.

Esto importa porque `V1` y la realidad no coinciden, y comparar contra él lleva a concluir que la
base está corrupta. No lo está: **`V2` borra y recrea** `space_types`, `spaces`, `space_schedules`,
`reservations` y `reservation_guests` con claves `uuid`, que es lo que hay. Para saber qué hay de
verdad, leer `V2` en adelante, no `V1`.

Estado actual: **`v11`**, todas aplicadas con éxito.

| Versión | Qué hizo | Cuándo |
| ------- | -------- | ------ |
| `1` | Baseline. **No ejecutada.** | 2026-07-28 |
| `2` | Reconstruye espacios y reservas con PK `uuid`; añade `in_progress` y `expired` al enum de estado | 2026-07-31 |
| `3` | RBAC: `roles`, `permissions`, `role_permissions`, `user_roles`. Elimina `users.role` | 2026-09-07 |
| `4` | Siembra 13 permisos | 2026-09-07 |
| `5` | Siembra espacios y horarios | 2026-09-07 |
| `4.1` | Tipo de espacio con id fijo. **Aplicada fuera de orden** | 2026-09-16 |
| `6` | `refresh_tokens` | 2026-09-16 |
| `7` | `institution_config` | 2026-09-16 |
| `8` | `spaces.under_maintenance` | 2026-09-16 |
| `9` | Estado de reserva calculado: `checked_in_at`, `cancelled_at`, `cancelled_by`. Elimina `reservations.status` y `reservation_guests` | 2026-09-16 |
| `10` | `users.email` | 2026-09-16 |
| `11` | `spaces.location` y `space_types.category` | 2026-09-16 |

**La `V4_1` se añadió al repo después de que la `V5` ya hubiera corrido.** Flyway rechaza por defecto
aplicar algo por detrás de lo ya ejecutado, así que abortaba el arranque antes de migrar nada. Se
resolvió con `spring.flyway.out-of-order: true` **temporal** en `application-local.yml`, retirado en
cuanto se aplicó. Si vuelve a aparecer *«Detected resolved migration not applied to database»*, es
esto otra vez: alguien intercaló una versión.

---

## 3. Tablas

`users` · `roles` · `permissions` · `role_permissions` · `user_roles` · `refresh_tokens` ·
`space_types` · `spaces` · `space_schedules` · `reservations` · `institution_config` ·
`flyway_schema_history`

Todas las claves primarias son `uuid` con `gen_random_uuid()`, salvo `institution_config`, que es una
fila única con `id SMALLINT` fijo a 1.

`reservation_guests` **ya no existe**: la eliminó la `V9` porque una reserva ocupa exactamente una
plaza (`booking-flow.md` §2).

**Roles: no hay columna.** El rol sale de `user_roles` → `roles.name`, en mayúsculas: `STUDENT` y
`ADMIN`. Los 13 permisos de `role_permissions` están sembrados pero **no se comprueban en ningún
sitio**; la autorización es sólo por rol (`@PreAuthorize("hasRole('ADMIN')")`).

**El estado de una reserva no se guarda**, se calcula del reloj a partir de `created_at`,
`checked_in_at`, `cancelled_at` y los límites del bloque. Ver `booking-flow.md` §14.

**La categoría de un espacio no está en `spaces`**, sino en `space_types.category`
(`SPORTS` | `STUDY` | `LAB`, con `CHECK`). El tipo ya es la taxonomía: duplicarla en la fila del
espacio permitiría que dos salas del mismo tipo se contradijeran. `spaces.location` sí es del
espacio, porque cada uno está en un sitio.

---

## 4. Datos

| Tabla | Filas | Origen |
| ----- | ----- | ------ |
| `users` | 2 | Insertados a mano |
| `roles` | 2 | `V3` |
| `spaces` | 6 | `V5` |
| `space_schedules` | 30 | `V5` |
| `reservations` | 0 | — |
| `institution_config` | 1 | `V7`: bloque 120 min, tolerancia 15, uso mínimo 75, 1 reserva por espacio y día |
| `space_types` | 1 | `V4.1`: «Cancha deportiva», categoría `SPORTS` desde la `V11` |

Los 6 espacios tienen `location = 'Complejo Deportivo Central'`. Es un **marcador de posición**, no
un dato real: hacía falta un valor determinista para poder imponer `NOT NULL` sobre filas anteriores
a la columna, igual que pasó con `users.email` en la `V10`. Las ubicaciones de verdad hay que
pedirlas a la universidad.

**«Gimnasio de Pesas» no tiene ni una fila en `space_schedules`.** Es el espacio que ya existía
antes de la `V5`, que sólo sembró horarios para los cinco suyos. Sin horario no hay bloques, así que
el catálogo lo lista siempre sin plazas —correcto según el modelo, pero parece un fallo. O se le
siembra horario, o se quita.

### Usuarios

| Rol | Documento | Correo | Contraseña | Nombre |
| --- | --------- | ------ | ---------- | ------ |
| `STUDENT` | `1234567890` | `1234567890@univgo.edu` | `Contrasena123!` | John Edit |
| `ADMIN` | `0987654321` | `0987654321@univgo.edu` | `Admin123!` | Daniel Ortiz |

**Son credenciales de desarrollo sobre datos ficticios.** Ninguna sirve fuera de esta base, y aquí
están para que nadie tenga que adivinarlas. Si esta base llega a tener datos reales, esta tabla sale
del repositorio y las cuentas se rotan.

El login acepta el documento **o** el correo, indistintamente y sin distinguir mayúsculas.

Los correos los generó la `V10` a partir del documento: esas filas son anteriores a la columna y
hacía falta un valor determinista antes de poder imponer `NOT NULL`. No son direcciones reales.

### `seed_gym_data.sql` no se puede ejecutar

`univgo-backend/src/main/resources/db/seed/seed_gym_data.sql` **choca con lo que ya hay**: inserta 5
espacios sobre los 6 que sembró la `V5` —los duplicaría— y crea un estudiante con el documento
`1234567890`, que ya existe. Es una única sentencia encadenada, así que revienta contra
`users_identification_key` y no inserta nada.

Sirve como referencia de hashes BCrypt y poco más. Para una base nueva y vacía sí funciona.

---

## 5. Cómo consultar el estado

En el SQL Editor de Neon, o con `psql "<url>"` recomponiendo la URL desde `application-local.yml`
(el formato JDBC no sirve: hay que quitar el `jdbc:` e incrustar usuario y contraseña).

```sql
select installed_rank, version, description, success
from flyway_schema_history order by installed_rank;

select u.identification, u.email, u.first_name, u.last_name, r.name as role
from users u
  left join user_roles ur on ur.user_id = u.id
  left join roles r on r.id = ur.role_id;

select s.name, s.location, s.capacity, s.under_maintenance, t.name as type, t.category
from spaces s join space_types t on t.id = s.space_type_id order by s.name;

select (select count(*) from spaces) as spaces,
       (select count(*) from space_schedules) as schedules,
       (select count(*) from reservations) as reservations,
       (select count(*) from refresh_tokens) as refresh_tokens;
```

---

## 6. Pendientes conocidos

- **Los permisos no se comprueban.** `role_permissions` está sembrado y sin usar. O se empieza a
  comprobar, o se retira: una tabla que promete autorización y no la aplica engaña al que la lee.
- **Sin cuentas de prueba por Flyway.** Los dos usuarios se insertaron a mano, así que una base nueva
  no los tiene. Una migración `R__` repetible o un seed idempotente lo arreglaría.
- **Esta base no tiene copia de seguridad propia** más allá de lo que ofrezca Neon.
