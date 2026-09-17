# PT-04: búsqueda y recomendación

## Alcance

PT-04 implementa búsqueda paginada de músicos, recomendaciones simples, decisiones de revisión,
búsquedas de integrantes, postulaciones e intención de contacto. No crea chats, convocatorias de
eventos, eventos, ensayos, marketplace, reputación ni moderación avanzada.

`MemberSearch` significa reclutamiento de un integrante estable. `Call` y `Application` continúan
reservados para convocatorias de PT-05.

## Score de compatibilidad

El puntaje máximo es 100 y suma componentes independientes:

| Señal          | Máximo | Criterio inicial                                 |
| -------------- | -----: | ------------------------------------------------ |
| Géneros        |     30 | Proporción de etiquetas compartidas              |
| Instrumentos   |     25 | Proporción de etiquetas compatibles              |
| Zona           |     15 | Coincidencia exacta normalizada del texto        |
| Disponibilidad |     10 | Perfil disponible cuando el contexto la requiere |
| Influencias    |     10 | Proporción de etiquetas compartidas              |
| Experiencia    |     10 | Cercanía ordinal entre niveles                   |

La respuesta incluye `compatibilityReasons`. No se usan datos privados, ratings ni IA. Para evitar
consultas ilimitadas, los ordenamientos calculados procesan como máximo 200 candidatos y cada página
acepta hasta 50 resultados. `candidateLimitReached` avisa cuando se alcanzó el límite inicial.

La ubicación todavía no tiene coordenadas en el perfil músico: `LOCATION` prioriza coincidencia de
zona, no distancia geográfica.

## Privacidad y permisos

- Visitantes: perfiles y búsquedas `PUBLIC`, con ubicación/links filtrados.
- Usuarios autenticados: también `REGISTERED_ONLY`.
- `PRIVATE`: nunca aparece en buscadores o recomendaciones.
- Recomendaciones excluyen cuenta propia, usuarios inactivos/suspendidos, descartes del contexto e
  integrantes actuales de la banda.
- Solo el owner de banda publica o gestiona búsquedas en su nombre.
- Una búsqueda individual exige perfil músico activo con `isSoloProject=true`.
- Solo el músico dueño del perfil puede postularlo y existe una postulación por búsqueda/perfil.

## Endpoints

### Búsqueda y recomendaciones

- `GET /musicians/search`
- `GET /musicians/:id/public`
- `GET /recommendations/musicians?bandProjectId=&limit=`
- `POST /recommendations/musicians/:id/decision`

### Reclutamiento

- `POST /member-searches`
- `GET /member-searches`
- `GET /member-searches/my`
- `GET /member-searches/:id`
- `PATCH /member-searches/:id`
- `POST /member-searches/:id/close`
- `POST /member-searches/:id/applications`
- `GET /member-searches/:id/applications`
- `GET /member-search-applications/my`
- `PATCH /member-search-applications/:id/status`

### Contacto inicial

- `POST /contact-intents`
- `GET /contact-intents/my`

## Prueba manual mínima

1. Crear dos usuarios, activar `MUSICIAN` y completar perfiles activos, públicos y disponibles.
2. Buscar con `GET /musicians/search?instrument=bajo&genre=rock&page=1&limit=10`.
3. Consultar recomendaciones y registrar `DISMISSED`; repetir y comprobar que no reaparece.
4. Crear una búsqueda individual o indicar `bandProjectId` de una banda propia.
5. Desde el segundo usuario, postularse una vez y comprobar que el segundo intento devuelve `409`.
6. Desde el owner, listar postulaciones y marcar una como `REVIEWED` o `ACCEPTED`.
7. Registrar un `ContactIntent`; comprobar que no se creó ninguna conversación de chat.
8. Repetir consultas sin JWT y verificar que `REGISTERED_ONLY` y campos privados no aparecen.

## Pendiente para PT-05

- Implementar lifecycle de `Call` y `Application` para convocatorias temporales.
- Selección múltiple de postulantes y reglas de cierre.
- Relación de convocatorias con venues, eventos y organizadores.
- Notificaciones de cambios de estado.
- Mantener separado el reclutamiento permanente de integrantes.
