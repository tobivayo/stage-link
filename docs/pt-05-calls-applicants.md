# PT-05: convocatorias y postulantes

## Alcance

PT-05 implementa convocatorias públicas o restringidas, postulaciones de músicos y bandas,
revisión, preselección, selección múltiple, confirmación de fecha, cancelación, reapertura,
historial de estados y auditoría. No crea eventos: una convocatoria `COMPLETED` queda como insumo de
PT-06.

`MemberSearch` continúa representando reclutamiento permanente para integrar un proyecto. `Call`
representa una oportunidad fechada y no comparte postulaciones con ese dominio.

## Modelo

- `Call`: organizador, tipo, fecha propuesta, cupos, condiciones, cachet, requisitos y visibilidad.
- `Application`: postulante músico o banda, mensaje, necesidades técnicas, cachet y estado.
- `CallConfirmation`: respuesta del seleccionado a la fecha propuesta. La aceptación del organizador
  está implícita al publicar la convocatoria.
- `CallStatusHistory`: transición, actor, motivo y fecha.
- `AuditLog`: acciones relevantes de creación, edición y estado.

La migración exige mediante `CHECK` que una convocatoria tenga el contexto correspondiente a su
`organizerType` y que una postulación represente exactamente un músico o una banda. Los índices
únicos impiden duplicar al mismo postulante en una convocatoria.

## Máquina de estados

Convocatoria:

```text
OPEN <-> IN_REVIEW -> CLOSED -> COMPLETED
  |         |           |
  +---------+-----------+-> CANCELLED
                 CLOSED/CANCELLED -> OPEN o IN_REVIEW
```

- Crear siempre produce `OPEN`.
- Edición de contenido: solamente `OPEN` o `IN_REVIEW`.
- Completar los cupos durante selección produce `CLOSED`.
- Cuando todos los seleccionados confirman y se cubrieron los cupos, produce `COMPLETED`.
- `COMPLETED` es terminal para PT-05.
- Reabrir restaura postulaciones canceladas por la cancelación de la convocatoria; seleccionados que
  rechazaron la fecha pasan a `REJECTED`.

Postulación:

```text
PENDING -> REVIEWED <-> PRESELECTED -> SELECTED
    \          \             \          -> confirmación
     \          +-------------+-> REJECTED
      +--------------------------> WITHDRAWN
```

Un seleccionado no puede retirarse: debe responder la confirmación. No se crea automáticamente un
evento ni un chat.

## Privacidad y permisos

- Visitante: solamente convocatorias `PUBLIC`; la respuesta omite datos internos del organizador,
  condiciones y requisitos técnicos.
- Usuario registrado: `PUBLIC` y `REGISTERED_ONLY` con detalle ampliado.
- Organizador: también puede consultar su convocatoria `PRIVATE`, editarla y gestionar postulantes.
- Músico: necesita perfil activo propio para postularse.
- Banda: solamente `ownerUserId` puede postularla.
- Venue y banda: solamente el propietario puede crear una convocatoria en su nombre.
- `PRODUCER` queda modelado, pero se rechaza mientras no exista el rol correspondiente.

## Endpoints

Convocatorias:

- `POST /calls`
- `GET /calls`
- `GET /calls/my`
- `GET /calls/:id`
- `PATCH /calls/:id`
- `POST /calls/:id/status`
- `POST /calls/:id/cancel`
- `POST /calls/:id/reopen`
- `GET /calls/:id/status-history`

Postulaciones y selección:

- `POST /calls/:id/applications`
- `GET /calls/:id/applications`
- `GET /call-applications/my`
- `GET /call-applications/:id`
- `POST /call-applications/:id/withdraw`
- `POST /call-applications/:id/review`
- `POST /call-applications/:id/preselect`
- `POST /call-applications/:id/remove-preselection`
- `POST /calls/:id/select-applicants`

Confirmación:

- `GET /calls/:id/confirmations`
- `POST /call-confirmations/:id/confirm`
- `POST /call-confirmations/:id/decline`

Los listados aceptan paginación y filtros. `GET /calls` admite `genre`, `location`, `dateFrom`,
`dateTo`, `type`, `status`, `venueProfileId`, `page` y `limit`. El listado de postulantes admite
`status`, `applicantType`, `genre`, `page` y `limit`.

## Prueba manual mínima

1. Crear dos usuarios, activar `MUSICIAN` y completar sus perfiles.
2. Con el primero, crear una convocatoria `MUSICIAN` con `maxSelectedApplicants: 1`.
3. Consultarla sin token y comprobar la vista pública limitada.
4. Con el segundo, postular su perfil. Repetir y comprobar `409`.
5. Como organizador, revisar, preseleccionar y quitar la preselección.
6. Seleccionar la postulación. La convocatoria debe quedar `CLOSED` y crearse una confirmación.
7. Como postulante, confirmar. La convocatoria debe quedar `COMPLETED`.
8. Repetir con otra convocatoria y rechazar la fecha; como organizador, reabrirla.
9. Consultar el historial y verificar todas las transiciones.

## PT-06

PT-06 podrá consumir convocatorias `COMPLETED` para crear un `Event`, copiar la fecha/venue y crear
participantes desde postulaciones seleccionadas y confirmadas. Debe ser una operación explícita e
idempotente; PT-05 no crea eventos, ensayos ni calendario.
