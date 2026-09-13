# Arquitectura inicial de StageLink

## Objetivo y alcance

PT-01 estableció la base reproducible, PT-02 agregó identidad/autenticación y PT-03 agrega perfiles,
bandas, integrantes, privacidad y portfolio. Búsqueda y los dominios transaccionales permanecen
fuera del alcance actual.

## Organización del monorepo

El repositorio usa npm workspaces para minimizar infraestructura durante la etapa inicial:

- `apps/mobile`: aplicación Angular standalone con Ionic y Capacitor.
- `apps/api`: API NestJS y acceso a datos con Prisma.
- `packages/shared`: contratos, constantes y utilidades TypeScript independientes de frameworks.
- `docs`: decisiones y documentación técnica versionada.

Cada aplicación puede compilarse y ejecutarse por separado. El lockfile único asegura que CI y los
equipos locales instalen el mismo grafo de dependencias.

## Mobile

La aplicación usa componentes standalone y rutas lazy. `core` queda reservado para servicios
singleton, guards e interceptors; `shared` para UI reutilizable; y `domains` para features verticales.
Las rutas lazy incluyen login/registro, dashboard, configuración, perfiles profesionales, bandas,
integrantes y portfolio. La ruta pública de perfil queda fuera del guard de sesión. Son pantallas
funcionales mínimas, no el diseño final del producto.

El tema parte de `#252323` como fondo oscuro, `#D0E114` como primario y `#ED7D3A` como secundario.
Se contemplan safe areas y tamaños fluidos para una experiencia mobile first. Capacitor está
configurado, pero Android e iOS se generarán cuando comience el trabajo nativo.

**TODO técnico:** el build usa temporalmente el builder Webpack compatible de Angular. El builder
Vite nativo de Angular 22 aborta en el entorno macOS x64 usado para inicializar el repositorio;
migrar nuevamente a `@angular/build:application` queda como deuda acotada cuando la dependencia
nativa sea compatible.

## API

NestJS funciona como monolito modular. Cada carpeta bajo `src/modules` representa un límite de
dominio futuro, no un microservicio. Esta decisión mantiene transacciones y desarrollo simples, y
permite extraer servicios más adelante solo si la escala lo justifica.

Las piezas transversales actuales son:

- `config`: carga y validación temprana de variables de entorno.
- `database/prisma`: cliente Prisma global y ciclo de vida de conexión.
- `health`: `GET /health`, con estado del proceso y conectividad de PostgreSQL.
- `common/auth`: guard JWT, autorización declarativa por roles y usuario actual.

`auth`, `users`, `roles`, `user-preferences`, `profiles`, `bands` y `portfolio` son funcionales. Los
demás módulos de negocio son placeholders deliberados y no exponen endpoints.

Los límites iniciales son `users`, `auth`, `roles`, `profiles`, `bands`, `venues`, `providers`,
`calls`, `events`, `rehearsals`, `chat`, `marketplace`, `ratings`, `reports`, `admin` y `audit`. Crear
un módulo no implica que su funcionalidad ya exista.

## Datos

PostgreSQL es la fuente de verdad. Los IDs son UUID, las entidades mutables tienen `createdAt` y
`updatedAt`, y el contenido recuperable agrega `deletedAt` para soft delete. Las tablas de unión y
`AuditLog` son registros históricos y no usan soft delete.

El esquema incluye usuarios, preferencias y roles; perfiles con administradores de alcance local;
bandas e invitaciones; eventos y ensayos con participantes; ubicaciones; convocatorias y
postulaciones; conversaciones con adjuntos y lectura; operaciones de marketplace; calificaciones,
reportes y auditoría. El detalle se encuentra en [database-design.md](database-design.md).

`Rating` y `Report` poseen destinos explícitos con claves foráneas. La migración agrega restricciones
SQL para exigir exactamente un destino, puntuaciones entre 1 y 10, rangos de fechas válidos y precios
no negativos. La futura capa de aplicación deberá repetir estas reglas para devolver errores de
dominio claros antes de llegar a la base de datos.

La privacidad se aplica en el mapper de salida: primero se valida que el perfil esté activo y sea
visible para el visitante; luego se filtran ubicación, contacto, links y portfolio por `Visibility`.
Ownership se resuelve con `userId` para músico y `ownerUserId` para banda, venue y proveedor.

## Autenticación y seguridad

Docker Compose expone únicamente PostgreSQL para desarrollo. API y mobile se ejecutan en el host para
mantener hot reload rápido. Las credenciales incluidas son solo valores locales; `.env` nunca se
versiona.

Las contraseñas se procesan con Argon2id y nunca se exponen. Los DTOs aplican whitelist, rechazo de
campos desconocidos y validaciones de formato. Passport valida JWT Bearer de vida corta; en cada
request la estrategia vuelve a comprobar en PostgreSQL que el usuario siga activo y reconstruye sus
roles activos, evitando confiar únicamente en claims antiguos.

PT-02 adopta JWT de acceso stateless sin refresh token. Logout se audita y elimina la sesión local,
pero no revoca un token copiado; su ventana máxima es `JWT_EXPIRES_IN` (900 segundos por defecto).
Revocación, rotación y recuperación de contraseña quedan para hardening posterior.

La app web guarda temporalmente el token en `localStorage`. Esto permite validar el flujo inicial,
pero una compilación nativa deberá usar Keychain/Keystore mediante un plugin seguro de Capacitor.

## Calidad y CI

ESLint analiza TypeScript y templates Angular; Prettier mantiene estilo uniforme. GitHub Actions usa
`npm ci`, levanta PostgreSQL, valida y genera Prisma, aplica migraciones, ejecuta el seed, comprueba
formato, corre tests, ejecuta lint y compila los workspaces. No existe ningún paso de despliegue.

## Próximos paquetes sugeridos

1. **PT-04:** búsqueda y recomendación de perfiles visibles.
2. Convocatorias, postulaciones, eventos y ensayos.
3. Chat en tiempo real y notificaciones.
4. Marketplace, calificaciones, reportes y herramientas administrativas.
5. Observabilidad, recuperación de cuenta, refresh/revocación, hardening y despliegue.

Cada paquete debería agregar tests unitarios e integrales, migraciones propias y contratos públicos
en `packages/shared` solo cuando exista más de un consumidor real.
