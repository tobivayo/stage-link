# PT-03: perfiles y bandas/proyectos

## Alcance

PT-03 implementa perfiles de músico, venue y proveedor; bandas/proyectos e integrantes; links;
portfolio por URL; ownership; auditoría; y respuestas públicas, registradas y de propietario. No
incluye búsqueda, convocatorias, eventos, chat, marketplace ni reputación.

## Decisiones de modelado

- Instrumentos, géneros y servicios son arrays de etiquetas normalizadas a minúsculas. PT-04 podrá
  migrar los términos más usados a catálogos sin bloquear la edición actual.
- El solista es `MusicianProfile` con `isSoloProject=true`. Las futuras postulaciones apuntan
  directamente a ese perfil; las grupales apuntan a `BandProject`.
- `ownerUserId` es la autoridad única de banda, venue o proveedor. El dueño de una banda también
  tiene una membresía interna `ADMIN`, pero no puede removerse.
- Una invitación acepta `userId` o email. Si el email todavía no está registrado, puede aceptarse
  después de crear una cuenta con esa misma dirección. PT-03 no envía emails.
- Portfolio admite URLs externas y metadata. `PortfolioItemShare` permite que un integrante muestre
  material de su banda en su perfil músico sin duplicarlo.
- `PUBLIC`, `REGISTERED_ONLY` y `PRIVATE` se evalúan para perfil, ubicación, contacto, links y
  portfolio. Los perfiles inactivos o suspendidos solo son visibles para su propietario.

## Endpoints

### Perfiles

- `GET /profiles/me`
- `GET /profiles/public/:type/:id` — autenticación opcional
- `POST /profiles/musician`
- `GET /profiles/musician/me`
- `PATCH /profiles/musician/me`
- `POST /profiles/venue`
- `GET /profiles/venue/me`
- `PATCH /profiles/venue/:id`
- `POST /profiles/provider`
- `GET /profiles/provider/me`
- `PATCH /profiles/provider/:id`

### Bandas e integrantes

- `POST /bands`
- `GET /bands/my`
- `GET /bands/:id` — autenticación opcional
- `PATCH /bands/:id`
- `GET /bands/:id/members`
- `POST /bands/:id/invitations`
- `GET /bands/invitations/me`
- `POST /bands/invitations/:id/accept`
- `POST /bands/invitations/:id/reject`
- `DELETE /bands/:id/members/:memberId`

### Portfolio

- `POST /portfolio`
- `GET /portfolio/me`
- `GET /portfolio/profile/:type/:id` — autenticación opcional
- `PATCH /portfolio/:id`
- `DELETE /portfolio/:id`
- `POST /portfolio/:id/share-on-my-profile`
- `DELETE /portfolio/:id/share-on-my-profile`

Salvo las rutas marcadas como opcionales, todos los endpoints requieren JWT. Crear o editar exige
rol habilitante y/o ownership. La creación de perfil promueve el rol correspondiente desde
`PENDING_PROFILE` a `ACTIVE`.

## Prueba manual mínima

1. Levantar PostgreSQL, migrar, ejecutar seed y arrancar el proyecto.
2. Registrar un usuario y copiar el JWT.
3. Solicitar `MUSICIAN` con `POST /roles/MUSICIAN/activate`.
4. Crear el perfil:

```bash
curl -X POST http://localhost:3000/profiles/musician \
  -H 'Authorization: Bearer REEMPLAZAR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"instruments":["Bajo"],"genres":["Rock"],"availableForProjects":true,"isSoloProject":true,"locationText":"Rosario","visibility":"PUBLIC","locationVisibility":"REGISTERED_ONLY"}'
```

5. Verificar que `/roles/me` muestre `MUSICIAN` activo.
6. Abrir `/profiles/public/musician/ID` sin JWT y comprobar que la ubicación no aparezca.
7. Repetir con JWT y comprobar que sí aparezca por ser `REGISTERED_ONLY`.
8. Crear una banda, invitar otro email, aceptar desde la segunda cuenta y verificar integrantes.
9. Crear un portfolio con URL externa y comprobar el filtrado público/registrado.

Tests y validación completa:

```bash
npm test
npm run validate
```

## Pendiente para PT-04

- Catálogos y aliases de instrumentos, géneros y servicios.
- Búsqueda por texto, filtros, paginación y distancia geográfica.
- Índices PostgreSQL apropiados (`GIN`, texto completo o trigramas) según consultas reales.
- Ranking/recomendación explicable basado solo en datos visibles.
- Pruebas de rendimiento y estrategia de actualización del índice.
