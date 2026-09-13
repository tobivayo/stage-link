# StageLink - Contexto funcional para PT-03

El Paquete de Trabajo PT-03 corresponde a Perfiles y bandas/proyectos.

Objetivo:
Implementar la base funcional de perfiles de músico, venue, proveedor, bandas/proyectos, integrantes, portfolio y visualización parcial de perfiles.

Requerimientos relacionados:

- RF-002 Gestionar perfil y roles.
- RF-003 Crear y administrar banda/proyecto.

Casos de uso relacionados:

- CU-003 Gestión de roles de usuario.
- CU-004 Gestión de perfil de músico.
- CU-005 Perfil de músico como proyecto individual.
- CU-006 Creación y administración de bandas o proyectos.
- CU-007 Gestión de integrantes de banda o proyecto.
- CU-008 Gestión de perfil de venue.
- CU-009 Validación manual de venues.
- CU-010 Gestión de perfil de proveedor.
- CU-011 Visualización parcial de perfiles para visitantes.
- CU-033 Gestión de portfolio.
- CU-068 Configuración de privacidad de ubicación.
- CU-071 Solicitud de baja de perfil.
- CU-072 Registrar acción de auditoría.

Reglas funcionales:

- Un usuario puede tener más de un rol simultáneamente.
- Un usuario músico puede formar parte de una o varias bandas/proyectos.
- Un músico puede operar como proyecto individual.
- Cada banda/proyecto tiene un único administrador.
- Cada venue tiene un único administrador.
- Los venues deben tener estado de validación, aunque la revisión administrativa completa se implementará más adelante.
- Los perfiles son parcialmente públicos para visitantes no registrados.
- Para ver información completa e interactuar, el usuario debe estar registrado.
- El portfolio puede pertenecer a músicos o bandas/proyectos.
- Los integrantes de una banda pueden decidir si cierto material del proyecto también aparece en su portfolio individual.
- La ubicación puede tener visibilidad PUBLIC, REGISTERED_ONLY o PRIVATE.
- Las acciones relevantes deben registrarse en auditoría si el módulo AuditLog ya está disponible.

Datos del perfil de músico:

- instrumentos.
- géneros de preferencia.
- influencias opcionales.
- experiencia/grupos/proyectos previos.
- disponibilidad para nuevos proyectos.
- ubicación.
- foto de perfil.
- links asociados.
- portfolio.

Datos del perfil de venue:

- nombre.
- ubicación.
- capacidad.
- géneros aceptados/preferidos.
- días y horarios disponibles.
- equipamiento.
- nombres/datos de contacto autorizados.
- estado de validación.

Datos del perfil de proveedor:

- tipos de servicios ofrecidos.
- zona de cobertura.
- descripción.
- links externos.
- datos de contacto configurables.

Datos de banda/proyecto:

- nombre.
- descripción.
- géneros.
- influencias opcionales.
- ubicación o zona.
- imagen principal.
- links externos.
- administrador único.
- integrantes.

No implementar en PT-03:

- búsqueda y recomendación de músicos.
- postulaciones a proyectos.
- convocatorias.
- eventos.
- ensayos.
- chat real.
- marketplace.
- calificaciones.
- reportes.
- panel administrativo completo.
