# Diseño inicial de base de datos

## Alcance

El esquema modela la identidad, los perfiles y las interacciones principales de StageLink sin
implementar todavía los dominios posteriores. PT-02 sí implementa identidad, roles y preferencias.
PostgreSQL conserva la integridad relacional y las migraciones agregan restricciones que Prisma
Schema Language no puede representar.

## Entidades principales

- `User`, `Role`, `UserRole` y `UserPreferences` separan identidad, permisos globales y preferencias.
- `MusicianProfile`, `VenueProfile` y `ProviderProfile` representan identidades públicas distintas.
- `ownerUserId` identifica al administrador único de banda, venue y proveedor. `VenueMember` y
  `ProviderMember` quedan preparados para colaboradores futuros sin cambiar el ownership de PT-03.
- `BandProject`, `BandMember` y `BandInvitation` cubren propiedad, membresía e invitaciones.
- `ProfileLink`, `PortfolioItem` y `PortfolioItemShare` cubren enlaces, material externo y la decisión
  de un integrante de mostrar material de banda en su portfolio individual.
- `MemberSearch` y `MemberSearchApplication` cubren reclutamiento de integrantes sin reutilizar las
  convocatorias de eventos de PT-05.
- `MusicianRecommendationDecision` conserva interés o descarte por usuario y contexto; `ContactIntent`
  registra una intención inicial sin crear chats.
- `Call`, `Application`, `CallConfirmation` y `CallStatusHistory` cubren convocatoria fechada,
  postulantes músicos/bandas, selección múltiple, aceptación de fecha y trazabilidad.
- `Event`, `EventParticipant`, `Rehearsal` y `RehearsalParticipant` registran participantes y estados.
- `Location` centraliza direcciones y coordenadas; la visibilidad de la dirección se configura en el
  recurso que la publica.
- `ChatConversation`, `ChatParticipant`, `ChatMessage` y `ChatMessageAttachment` preparan chats
  directos, grupales y contextuales con lectura incremental y adjuntos.
- `MarketplacePost` y `MarketplaceOperation` separan una publicación de la operación concretada.
- `Rating` exige un objetivo y una experiencia concreta, con puntuación de 1 a 10.
- `Report` registra moderación y asignación manual; `AuditLog` conserva acciones inmutables.

## Decisiones de modelado

1. Los roles globales no reemplazan permisos sobre venues o proveedores: las membresías determinan
   el alcance concreto.
2. Un usuario tiene como máximo un perfil de músico, pero puede administrar múltiples venues y
   proveedores.
3. Cada postulación corresponde exactamente a `MusicianProfile` o `BandProject`. `submittedByUserId`
   conserva quién actuó por la banda.
4. `ApplicationStatus.SELECTED` puede repetirse hasta `maxSelectedApplicants`. Cada selección genera
   una confirmación única; completar todos los cupos y confirmaciones deja la convocatoria lista para
   PT-06.
5. Los participantes de eventos admiten usuario, banda, venue o proveedor mediante claves foráneas
   explícitas y una restricción de exclusividad.
6. `Location` es reutilizable. `addressVisibility` se mantiene en venue, proveedor, evento o ensayo
   porque la política de publicación pertenece al contexto, no a la dirección.
7. El tipo de conversación define qué contexto puede estar informado. `lastReadMessageId` evita crear
   una fila de lectura por mensaje y participante.
8. Los adjuntos de chat tienen metadata propia, pero el almacenamiento físico queda fuera del esquema.
9. Marketplace separa el estado público del post del ciclo de una compra, alquiler o contratación.
10. Una calificación apunta exactamente a un perfil/proyecto y a una experiencia: postulación,
    participante de evento, participante de ensayo u operación de marketplace.
11. Los destinos polimórficos se modelan con claves foráneas opcionales y `CHECK`, evitando IDs
    genéricos sin integridad referencial.
12. Las entidades recuperables usan `deletedAt`; membresías, operaciones y auditoría conservan su
    historia sin soft delete.
13. `UserRole.status` distingue roles activos, pendientes de perfil e inactivos. PT-03 activa el rol
    profesional dentro de la misma transacción que crea su perfil o banda mínima.
14. `User` conserva aceptación de términos y ubicación inicial como texto. `Location` se reserva para
    perfiles y recursos con dirección estructurada.
15. `experienceLevel` es un dato ordenable opcional; `experience` se conserva como relato libre.
16. Cada `MemberSearch` pertenece exactamente a un músico individual o una banda. La migración lo
    garantiza con `CHECK`; `creatorUserId` conserva quién publicó.
17. La clave `contextKey` evita duplicar decisiones de recomendación cuando `bandProjectId` es nulo,
    comportamiento que un unique nullable de PostgreSQL no resolvería.
18. `ContactIntent` usa destino polimórfico validado por servicio y un `targetUserId` relacional. Un
    índice parcial impide más de una intención pendiente al mismo perfil por solicitante.
19. `Call` conserva el organizador concreto mediante relaciones opcionales verificadas por `CHECK` y
    `organizerType`; `PRODUCER` queda reservado hasta incorporar ese rol.
20. `Application` reutiliza el placeholder inicial y exige exactamente un músico o banda. Dos índices
    únicos evitan postulaciones duplicadas por convocatoria.
21. La aceptación del organizador está implícita en la fecha propuesta. `CallConfirmation` registra
    únicamente la respuesta del seleccionado y `CallStatusHistory` registra cada transición.

## Puntos pendientes

- Definir catálogo normalizado y aliases de instrumentos, géneros y servicios a partir del uso real.
- Decidir si las ubicaciones deben ser inmutables o generar snapshots para preservar eventos pasados.
- Integrar entrega real de invitaciones por email; PT-03 ya persiste destinatarios no registrados.
- Definir permisos detallados dentro de bandas, venues y proveedores más allá de `OWNER` y `ADMIN`.
- Establecer transiciones de estado válidas y reglas de sincronización entre postulaciones,
  participantes, publicaciones y operaciones.
- Evaluar recibos de lectura por mensaje si el producto necesita mostrar exactamente quién leyó cada
  mensaje en grupos grandes.
- Diseñar pagos, comisiones, monedas y disputas cuando se defina el alcance transaccional.
- Incorporar sanciones y reglas automáticas de moderación cuando exista una política operativa.
- Definir retención, anonimización y particionado de `AuditLog` y mensajes.
- Agregar constraints de autorización entre tablas que requieren lógica transaccional, por ejemplo
  que quien postula una banda sea administrador de esa banda.
