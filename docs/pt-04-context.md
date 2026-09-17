# StageLink - Contexto funcional para PT-04

El Paquete de Trabajo PT-04 corresponde a Búsqueda y recomendación.

Objetivo:
Implementar la base funcional para buscar músicos, aplicar filtros, obtener recomendaciones automáticas, analizar perfiles sugeridos, publicar búsquedas de integrantes y permitir postulaciones a proyectos.

Requerimientos relacionados:

- RF-004 Buscar y recomendar músicos.
- RF-005 Publicar búsqueda de integrantes y postularse.

Casos de uso relacionados:

- CU-012 Búsqueda de músicos mediante filtros.
- CU-013 Recomendación automática de músicos.
- CU-014 Análisis de músicos en formato de recomendación.
- CU-015 Publicación de búsquedas de músicos para proyectos.
- CU-016 Postulación de músicos a proyectos.
- CU-017 Contacto directo entre músicos, bandas y venues.
- CU-068 Configuración de privacidad de ubicación.
- CU-072 Registrar acción de auditoría.

Reglas funcionales:

- Los músicos pueden ser buscados por instrumento, género, ubicación, disponibilidad, experiencia e influencias.
- Las recomendaciones automáticas se basan en géneros, ubicación, disponibilidad, nivel de experiencia e influencias.
- La interfaz de análisis de músicos permite revisar perfiles recomendados de forma rápida, marcando interés o descarte.
- Músicos, bandas o proyectos pueden publicar búsquedas de integrantes.
- Las búsquedas de integrantes deben indicar perfil requerido, instrumento, género, experiencia deseada, disponibilidad esperada, ubicación y condiciones relevantes.
- Otros músicos pueden postularse a dichas búsquedas.
- La postulación incluye el perfil del músico y un mensaje opcional.
- La información visible debe respetar privacidad y permisos.
- Los visitantes no registrados solo ven información parcial.
- Los usuarios registrados pueden ver información ampliada según visibilidad.
- El contacto inicial puede registrarse, pero el chat completo pertenece a PT-07.
- Las acciones relevantes deben registrarse en auditoría si el módulo AuditLog ya está disponible.

No implementar en PT-04:

- Convocatorias de eventos.
- Postulación a convocatorias.
- Selección de postulantes a convocatorias.
- Confirmación de fechas.
- Eventos.
- Ensayos.
- Chat real.
- Marketplace.
- Calificaciones.
- Reportes.
- Administración avanzada.
