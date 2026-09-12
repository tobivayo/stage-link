# PT-02: usuarios, autenticación y roles

## Alcance implementado

PT-02 incluye registro, login, logout stateless, consulta del usuario actual, roles
autogestionables, preferencias, guards JWT y restricción por roles. No crea perfiles profesionales
ni habilita módulos posteriores.

## Preparación

Con PostgreSQL levantado y `apps/api/.env` creado:

```bash
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

El seed es idempotente y crea `USER`, `MUSICIAN`, `BAND_ADMIN`, `VENUE_ADMIN`, `PROVIDER` y `ADMIN`.
No crea usuarios de prueba.

## Endpoints

| Método   | Ruta                    | Auth  | Descripción                               |
| -------- | ----------------------- | ----- | ----------------------------------------- |
| `POST`   | `/auth/register`        | No    | Registra y devuelve JWT                   |
| `POST`   | `/auth/login`           | No    | Valida credenciales y devuelve JWT        |
| `POST`   | `/auth/logout`          | JWT   | Audita logout                             |
| `GET`    | `/users/me`             | JWT   | Devuelve usuario seguro                   |
| `GET`    | `/roles`                | JWT   | Lista roles disponibles                   |
| `GET`    | `/roles/me`             | JWT   | Lista asignaciones del usuario            |
| `POST`   | `/roles/:code/activate` | JWT   | Solicita un rol permitido                 |
| `DELETE` | `/roles/:code`          | JWT   | Desactiva un rol autogestionable          |
| `GET`    | `/roles/admin-check`    | ADMIN | Ejemplo mínimo de endpoint administrativo |
| `GET`    | `/user-preferences/me`  | JWT   | Obtiene preferencias                      |
| `PATCH`  | `/user-preferences/me`  | JWT   | Actualiza preferencias                    |

Los roles profesionales solicitados quedan en `PENDING_PROFILE`. El parámetro solo acepta
`MUSICIAN`, `BAND_ADMIN`, `VENUE_ADMIN` o `PROVIDER`; `USER` y `ADMIN` no son autogestionables.

## Prueba manual

Registrar una cuenta:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Ana","lastName":"Rojas","email":"ana@example.com","password":"Segura#1234","locationText":"Rosario","termsAccepted":true}'
```

Copiá `accessToken` y consultá una ruta privada:

```bash
curl http://localhost:3000/users/me \
  -H 'Authorization: Bearer REEMPLAZAR_TOKEN'
```

Solicitar el rol músico:

```bash
curl -X POST http://localhost:3000/roles/MUSICIAN/activate \
  -H 'Authorization: Bearer REEMPLAZAR_TOKEN'
```

Actualizar preferencias:

```bash
curl -X PATCH http://localhost:3000/user-preferences/me \
  -H 'Authorization: Bearer REEMPLAZAR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"pushNotificationsEnabled":false,"defaultVisibility":"PRIVATE"}'
```

## Pruebas automatizadas

```bash
npm test
```

La suite cubre registro exitoso, email duplicado, login válido e inválido, ruta protegida con y sin
JWT, y rechazo por rol insuficiente.

## Decisiones y pendientes

- Logout no mantiene una blacklist: audita la acción y el cliente elimina el token. Un token copiado
  expira naturalmente en un máximo de 15 minutos con la configuración por defecto.
- El JWT solo identifica al usuario. La estrategia consulta estado y roles actuales en cada request.
- `localStorage` es temporal para desarrollo web; una app nativa debe usar Keychain/Keystore.
- PT-03 debe crear los perfiles y promover roles de `PENDING_PROFILE` a `ACTIVE` mediante una acción
  controlada del backend.
