# StageLink

Plataforma mobile first para conectar músicos, bandas, venues, proveedores y organizadores. El
repositorio contiene PT-01 (arquitectura/base técnica), PT-02 (usuarios/autenticación) y PT-03
(perfiles, bandas e integrantes). Los dominios posteriores continúan como placeholders.

## Requisitos

- Node.js 24 o superior
- npm 11 o superior
- Docker Desktop o Docker Engine con Compose

Si usás nvm, ejecutá `nvm use` para seleccionar la versión declarada en `.nvmrc`.

## Inicio rápido

1. Instalá exactamente las dependencias del lockfile:

   ```bash
   npm ci
   ```

2. Creá los archivos locales de entorno:

   ```bash
   cp .env.example .env
   cp apps/api/.env.example apps/api/.env
   ```

   El `.env` raíz configura Docker Compose y `apps/api/.env` configura NestJS y Prisma. Angular no
   carga archivos `.env` automáticamente: `apps/mobile/.env.example` documenta la futura variable
   `API_URL`, cuyo valor de PT-01 está actualmente en `apps/mobile/src/environments/environment.ts`.

3. Levantá PostgreSQL:

   ```bash
   docker compose up -d postgres
   docker compose ps
   ```

4. Generá Prisma y aplicá las migraciones versionadas:

   ```bash
   npm run db:generate
   npm run db:deploy
   npm run db:seed
   ```

5. Iniciá API y mobile juntos:

   ```bash
   npm run dev
   ```

La app queda disponible en `http://localhost:4200`, la API en `http://localhost:3000` y el health
check en `http://localhost:3000/health`. La pantalla inicial permite crear una cuenta; el seed no
crea usuarios ni contraseñas de prueba.

Podés verificar la API con:

```bash
curl http://localhost:3000/health
```

Con PostgreSQL disponible, la respuesta debe indicar `"status":"ok"` y `"database":"up"`.

## Comandos principales

| Comando               | Descripción                                  |
| --------------------- | -------------------------------------------- |
| `npm run dev`         | Ejecuta API y mobile en paralelo             |
| `npm run dev:api`     | Ejecuta NestJS con recarga                   |
| `npm run dev:mobile`  | Ejecuta Angular/Ionic                        |
| `npm run build`       | Compila todos los workspaces                 |
| `npm run lint`        | Ejecuta ESLint en todos los workspaces       |
| `npm run format`      | Formatea el repositorio con Prettier         |
| `npm run validate`    | Valida Prisma, formato, lint, tests y builds |
| `npm run db:validate` | Valida el esquema Prisma                     |
| `npm run db:generate` | Genera el cliente Prisma                     |
| `npm run db:migrate`  | Crea y aplica una migración nueva            |
| `npm run db:deploy`   | Aplica migraciones ya versionadas            |
| `npm run db:seed`     | Crea o actualiza los roles base              |
| `npm run db:studio`   | Abre Prisma Studio                           |
| `npm test`            | Ejecuta los tests backend                    |

## Capacitor

Los proyectos nativos no se versionan en esta etapa. Cuando se necesiten:

```bash
npm install @capacitor/android @capacitor/ios --workspace @stagelink/mobile
npx cap add android --workspace @stagelink/mobile
npx cap add ios --workspace @stagelink/mobile
npm run build --workspace @stagelink/mobile
npm run cap:sync --workspace @stagelink/mobile
```

## Convención de commits

Se recomienda [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(mobile): add profile route
fix(api): handle database timeout
docs: clarify local setup
chore(deps): update Prisma
```

Los tipos iniciales recomendados son `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci` y
`chore`. Antes de subir cambios, ejecutá `npm run validate`.

## Ramas y versionado

Se recomienda un flujo trunk-based simple:

- `main` es la rama estable y debe protegerse con pull requests y CI obligatorio.
- El trabajo parte de `main` en ramas cortas: `feat/<alcance>`, `fix/<alcance>`,
  `docs/<alcance>` o `chore/<alcance>`.
- Los paquetes de trabajo pueden identificarse en el nombre, por ejemplo `feat/pt-02-auth`.
- No se realizan commits directos a `main`; cada cambio se integra mediante revisión.

El proyecto comienza en `0.x` y sigue Semantic Versioning. Los cambios internos compatibles avanzan
la versión minor; los fixes aislados avanzan patch. La estrategia de releases y tags se definirá
antes del primer despliegue.

## Autenticación de PT-02

La API usa contraseñas con Argon2id y tokens JWT Bearer de 15 minutos por defecto. Los JWT son
stateless: `POST /auth/logout` registra la acción en auditoría y el frontend elimina el token, pero
un token copiado antes del logout conserva validez hasta expirar. Refresh tokens y revocación quedan
fuera de PT-02.

`USER` se asigna activo al registrarse. `MUSICIAN`, `BAND_ADMIN`, `VENUE_ADMIN` y `PROVIDER` pueden
solicitarse desde la app y quedan en `PENDING_PROFILE`; PT-03 activa el rol cuando se crea el perfil.
`ADMIN` nunca puede autogestionarse. El frontend usa `localStorage` solo como base web de desarrollo;
antes de distribuir una app nativa deberá migrarse el token a almacenamiento seguro de Capacitor.

Los endpoints y ejemplos manuales están en
[docs/pt-02-authentication.md](docs/pt-02-authentication.md).

## Perfiles y bandas de PT-03

PT-03 implementa perfiles de músico, venue y proveedor, bandas/proyectos, invitaciones e integrantes,
portfolio por URL y vistas públicas con filtrado de visibilidad. Los roles pendientes se promueven a
`ACTIVE` al crear su entidad mínima. Las invitaciones por email se registran, pero su envío real queda
para un paquete de notificaciones.

Los endpoints, decisiones y pruebas manuales están en
[docs/pt-03-profiles-bands.md](docs/pt-03-profiles-bands.md).

## Próximo paquete

PT-04 debería implementar búsqueda y recomendación sobre perfiles activos y visibles, con filtros
por instrumentos, géneros, ubicación y disponibilidad. No debe acoplar el ranking a datos privados.

## Documentación

La arquitectura, límites y próximos pasos están detallados en
[docs/architecture.md](docs/architecture.md). El modelo relacional está documentado en
[docs/database-design.md](docs/database-design.md) y el checklist de cierre de PT-01 en
[docs/pt-01-validation.md](docs/pt-01-validation.md).
