# StageLink - Contexto funcional para PT-05

El Paquete de Trabajo PT-05 corresponde a Convocatorias y postulantes.

Objetivo:
Implementar la base funcional para crear convocatorias, recibir postulaciones, revisar postulantes, preseleccionar, seleccionar, confirmar fechas, cancelar o reabrir convocatorias.

Requerimientos relacionados:

- RF-006 Crear convocatoria.
- RF-007 Postularse a convocatoria.
- RF-008 Seleccionar postulantes y confirmar fecha.

Reglas funcionales:

- Una convocatoria puede ser creada por un venue, productor, músico o banda/proyecto.
- La convocatoria debe incluir fecha/hora, nombre del evento si aplica, estilos o géneros preferidos, cantidad de bandas/proyectos/músicos a seleccionar, condiciones ofrecidas y datos relevantes para el postulante.
- Una convocatoria puede seleccionar uno o más postulantes.
- Las postulaciones pueden ser de músicos individuales o bandas/proyectos.
- El postulante puede agregar un mensaje opcional, preferencias, necesidades técnicas o cachet solicitado.
- El sistema debe evitar postulaciones duplicadas.
- El organizador puede revisar postulaciones.
- El organizador puede preseleccionar postulantes.
- El organizador puede seleccionar postulantes finales.
- La confirmación de fecha requiere aceptación de ambas partes.
- El creador de la convocatoria se considera aceptado inicialmente al proponer la fecha.
- El postulante seleccionado debe confirmar o rechazar.
- Si un seleccionado cancela o rechaza, el organizador puede reabrir la convocatoria, volverla a revisión o cancelarla.
- La convocatoria mantiene trazabilidad de cambios de estado.
- Las acciones relevantes deben registrarse en auditoría si el módulo AuditLog ya está disponible.

Estados de convocatoria:

- OPEN.
- IN_REVIEW.
- CLOSED.
- COMPLETED.
- CANCELLED.

Estados de postulación:

- PENDING.
- REVIEWED.
- PRESELECTED.
- SELECTED.
- REJECTED.
- CANCELLED.
- WITHDRAWN.

Estados de confirmación:

- PENDING_CONFIRMATION.
- CONFIRMED.
- DECLINED.

Reglas de privacidad y permisos:

- Visitantes no registrados pueden ver solo información pública limitada.
- Usuarios autenticados pueden ver información ampliada según visibilidad.
- Solo el creador/organizador puede editar, cerrar, cancelar, reabrir, revisar o seleccionar postulantes.
- Solo el administrador de una banda/proyecto puede postularla a una convocatoria.
- No deben exponerse datos privados del organizador, venue o postulantes a usuarios no autorizados.

No implementar en PT-05:

- Creación completa de eventos.
- Calendario avanzado.
- Ensayos.
- Chat real.
- Marketplace.
- Calificaciones.
- Reportes.
- Panel administrativo avanzado.
- Pagos o contratos formales.
