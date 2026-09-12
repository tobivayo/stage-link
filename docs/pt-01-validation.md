# Validación de PT-01: arquitectura y base técnica

Fecha de revisión: 2026-08-31.

| Área          | Estado | Evidencia                                                                      |
| ------------- | ------ | ------------------------------------------------------------------------------ |
| Arquitectura  | Cumple | npm workspaces con `apps/mobile`, `apps/api`, `packages/shared` y `docs`       |
| Repositorio   | Cumple | `.gitignore`, lockfile, scripts, Conventional Commits, ramas y SemVer          |
| Entorno       | Cumple | Docker Compose para PostgreSQL y ejemplos de entorno separados                 |
| Backend       | Cumple | NestJS compila, `/health`, configuración validada y Prisma 7                   |
| Frontend      | Cumple | Angular/Ionic compila, routing lazy, shell mínimo y theme StageLink            |
| Base de datos | Cumple | Esquema válido, migración inicial y 28 tablas con relaciones y enums           |
| CI/CD         | Cumple | Instalación, PostgreSQL, Prisma, migración, formato, lint y builds; sin deploy |
| Documentación | Cumple | README, arquitectura, diseño de datos, ejecución local y próximos pasos        |

## Validaciones ejecutadas

- `prisma validate` y generación del cliente.
- ESLint sobre API, mobile, templates Angular y paquete compartido.
- Build de producción de NestJS, Angular/Ionic y shared.
- Prettier sobre el repositorio completo.
- Ejecución de la migración inicial sobre PostgreSQL embebido, creando 28 tablas.
- Parseo de `docker-compose.yml` y `.github/workflows/ci.yml` como YAML.

## Pendientes técnicos aceptados

- Docker no está instalado en la máquina de revisión; el arranque del contenedor debe confirmarse en
  una estación con Docker. CI ejecuta PostgreSQL real y aplica la migración.
- El frontend usa temporalmente el builder Webpack de Angular por una incompatibilidad del builder
  Vite con el entorno macOS x64 utilizado. La migración al builder actual está marcada como TODO.
- `apps/mobile/.env.example` es contractual: Angular usa todavía el archivo `environment.ts`. La
  configuración runtime se incorporará cuando existan entornos de despliegue.

No se detectó lógica funcional avanzada ni despliegue fuera del alcance de PT-01.
