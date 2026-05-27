# MateFlow — Arquitectura y Especificación Técnica

> Documento maestro de hand-off entre el frontend (React + TypeScript + Zustand) y el backend objetivo (C# Minimal APIs + PostgreSQL).
> Audiencia: Tech Leads, Arquitectos Backend, DBAs.
> Estado del frontend: prototipo completo con persistencia local (mocks). Listo para sustituir mocks por API real.

---

## A. Stack actual (Frontend)

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | **React 19 + TanStack Start** | SSR opcional, file-based routing en `src/routes/`. |
| Build | **Vite 7** | Cloudflare Worker como runtime serverless. |
| Lenguaje | **TypeScript estricto** (`strict: true`) | Prohibido `any` en código de dominio. |
| Estado | **Zustand** con middleware `persist` | Cada slice corresponde a un agregado del dominio. |
| Estilos | **Tailwind CSS v4** + tokens semánticos en `src/styles.css` | Diseño basado en OKLCH. |
| UI Kit | **shadcn/ui** + **lucide-react** + **sonner** | Sheets/Popovers responsivos. |
| Animación | **framer-motion** + SVG keyframes (MateBot) | Sin librerías 3D. |
| Datos | **TanStack Query** | Reservado para integración con el backend C#. |
| Voz | **Web Speech API** vía `useDictadoVoz` | Sin dependencia externa. |
| PWA | Service Worker + manifest | Empaquetado nativo previsto vía **Tauri** (ver §E). |

### Convenciones

- Stores Zustand: namespaced `useXxxStore`, persistidos bajo `mateflow.<dominio>.<version>` en `localStorage`.
- DTOs en `src/types/dominio.ts` — espejo 1:1 del modelo relacional propuesto en §B.
- Patrón **Event Sourcing** en `fitnessStore` y `kpisStore` (append-only).
- Patrón **CRUD clásico** en `tareasStore`, `habitosStore`, `gamificacionStore`.
- IA centralizada en el componente global **MateBot** (`src/components/matebot/`).

---

## B. Modelo de Datos — PostgreSQL sugerido

### Diagrama lógico (DER simplificado)

```text
auth.users ──┬──< profiles
             ├──< areas
             ├──< tareas ──< adjuntos
             ├──< habitos ──< habitos_registros
             ├──< kpis ──< eventos_kpi
             ├──< eventos_fisicos
             ├──< plantillas_rutina
             ├──< gamificacion_perfil
             └──< gamificacion_logros
```

### B.1 `profiles` (espejo de `DTO_Usuario`)

```sql
CREATE TABLE profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           citext NOT NULL UNIQUE,
  nombre_completo text   NOT NULL,
  avatar_url      text,
  zona_horaria    text   NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
  fecha_registro  timestamptz NOT NULL DEFAULT now()
);
```

### B.2 `areas` (PARA — Areas)

```sql
CREATE TABLE areas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug        text NOT NULL,                       -- ej: "salud", "facultad"
  titulo      text NOT NULL,
  color_oklch text,
  UNIQUE (user_id, slug)
);
```

### B.3 `tareas` (espejo de `DTO_Tarea`)

```sql
CREATE TYPE categoria_para AS ENUM ('Proyecto','Area','Recurso','Archivo');
CREATE TYPE estado_tarea  AS ENUM ('Activa','Completada','Archivada');

CREATE TABLE tareas (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titulo              text NOT NULL,
  categoria           categoria_para NOT NULL,
  area_vinculada_id   uuid REFERENCES areas(id) ON DELETE SET NULL,
  estado              estado_tarea NOT NULL DEFAULT 'Activa',
  fecha_creacion      timestamptz NOT NULL DEFAULT now(),
  fecha_programada    date,                         -- NULL => backlog
  puntos_experiencia  int NOT NULL DEFAULT 10 CHECK (puntos_experiencia >= 0),
  etiquetas           text[] NOT NULL DEFAULT '{}',
  notas_markdown      text,
  orden_mit           int                            -- usado por reordenarMITs()
);

CREATE INDEX idx_tareas_user_estado ON tareas (user_id, estado);
CREATE INDEX idx_tareas_user_fecha  ON tareas (user_id, fecha_programada);
CREATE INDEX idx_tareas_etiquetas   ON tareas USING GIN (etiquetas);
```

### B.4 `adjuntos` (espejo de `DTO_ArchivoAdjunto`)

```sql
CREATE TYPE tipo_icono_adjunto AS ENUM ('pdf','doc','sheet','slide','img','link','otro');

CREATE TABLE adjuntos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id         uuid NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  nombre           text NOT NULL,
  url              text NOT NULL,
  tipo_icono       tipo_icono_adjunto NOT NULL,
  fecha_adjuntado  timestamptz NOT NULL DEFAULT now()
);
```

### B.5 `habitos` y `habitos_registros`

```sql
CREATE TABLE habitos (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titulo            text NOT NULL,
  area              text NOT NULL,
  xp_por_completar  int  NOT NULL DEFAULT 5
);

-- `rachaActual` y `completadoHoy` NO se guardan: se calculan al vuelo.
CREATE TABLE habitos_registros (
  id          bigserial PRIMARY KEY,
  habito_id   uuid NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
  fecha       date NOT NULL,
  UNIQUE (habito_id, fecha)
);
CREATE INDEX idx_habitos_registros_fecha ON habitos_registros (habito_id, fecha DESC);
```

### B.6 `eventos_fisicos` y `plantillas_rutina` (Event Sourcing — Fitness)

```sql
CREATE TYPE tipo_evento_fisico AS ENUM ('NEAT','PAUSA_ACTIVA','ENTRENAMIENTO');

CREATE TABLE plantillas_rutina (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titulo          text NOT NULL,
  ejercicios      jsonb NOT NULL DEFAULT '[]'::jsonb,  -- array de strings
  fecha_creacion  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE eventos_fisicos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fecha_hora    timestamptz NOT NULL DEFAULT now(),
  tipo_evento   tipo_evento_fisico NOT NULL,
  metricas      text NOT NULL,
  plantilla_id  uuid REFERENCES plantillas_rutina(id) ON DELETE SET NULL,
  xp_otorgado   int  NOT NULL
);
-- APPEND-ONLY: NO se permiten UPDATE/DELETE (forzado por REVOKE + trigger).
REVOKE UPDATE, DELETE ON eventos_fisicos FROM PUBLIC;
CREATE INDEX idx_eventos_fisicos_user_fh ON eventos_fisicos (user_id, fecha_hora DESC);
```

### B.7 `kpis` y `eventos_kpi` (Quantified Self)

```sql
CREATE TYPE frecuencia_kpi AS ENUM ('DIARIO','SEMANAL','MENSUAL');
CREATE TYPE fuente_evento_kpi AS ENUM ('MANUAL','INCREMENTO_RAPIDO','IA');

CREATE TABLE kpis (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titulo          text NOT NULL,
  area            text NOT NULL,
  objetivo        numeric(10,2) NOT NULL CHECK (objetivo > 0),
  unidad          text NOT NULL,
  frecuencia      frecuencia_kpi NOT NULL,
  grupo           text,
  color_acento    text,
  fecha_creacion  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE eventos_kpi (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id      uuid NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
  fecha_hora  timestamptz NOT NULL DEFAULT now(),
  cantidad    numeric(10,2) NOT NULL CHECK (cantidad > 0),
  fuente      fuente_evento_kpi NOT NULL,
  nota        text
);
-- APPEND-ONLY igual que eventos_fisicos.
CREATE INDEX idx_eventos_kpi_kpi_fh ON eventos_kpi (kpi_id, fecha_hora DESC);
```

### B.8 Gamificación

```sql
CREATE TABLE gamificacion_perfil (
  user_id                 uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  nivel                   int NOT NULL DEFAULT 1,
  xp_actual               int NOT NULL DEFAULT 0,
  xp_para_siguiente_nivel int NOT NULL DEFAULT 100,
  xp_por_area             jsonb NOT NULL DEFAULT '[]'::jsonb  -- [{area, xp}]
);

CREATE TABLE gamificacion_logros (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  xp          int  NOT NULL,
  area        text,
  fecha       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_logros_user_fecha ON gamificacion_logros (user_id, fecha DESC);
```

**Decisión JSONB vs columnas:** `etiquetas` se modela como `text[]` (consultable con GIN). `xp_por_area` se mantiene como `jsonb` porque es estructura agregada, raramente filtrada por área individual desde SQL.

---

## C. Contratos de API (C# Minimal APIs)

> Convenciones: `Content-Type: application/json`. Autenticación: `Authorization: Bearer <jwt>` (Supabase-compatible o Identity propio). Todos los endpoints scopean por `user_id` derivado del token. Códigos: 200 OK, 201 Created, 204 No Content, 400 Validación, 401 Auth, 404 No encontrado, 422 Léxico rechazado.

### C.1 Tareas

| Método | Ruta | Descripción |
|---|---|---|
| `GET`    | `/api/tareas?estado=Activa&categoria=Proyecto` | Lista filtrada |
| `POST`   | `/api/tareas` | Crear tarea |
| `PATCH`  | `/api/tareas/{id}/estado` | Cambiar `estado` |
| `PATCH`  | `/api/tareas/{id}/programar` | Mover a fecha o backlog |
| `PATCH`  | `/api/tareas/{id}/notas` | Editar markdown + etiquetas |
| `POST`   | `/api/tareas/{id}/adjuntos` | Adjuntar archivo (mock Drive) |
| `POST`   | `/api/tareas/mits/orden` | Persistir orden manual MITs |

**POST `/api/tareas` — Request:**
```json
{
  "titulo": "Revisar gastos del mes",
  "categoria": "Area",
  "areaVinculadaId": "9f...uuid",
  "puntosExperiencia": 10,
  "etiquetas": ["#Finanzas"],
  "fechaProgramada": "2026-05-28",
  "notasMarkdown": null
}
```
**Response 201:**
```json
{
  "id": "t-3f7a1b9",
  "titulo": "Revisar gastos del mes",
  "categoria": "Area",
  "areaVinculadaId": "9f...uuid",
  "estado": "Activa",
  "fechaCreacion": "2026-05-27T10:14:22Z",
  "fechaProgramada": "2026-05-28",
  "puntosExperiencia": 10,
  "etiquetas": ["#Finanzas"],
  "adjuntos": []
}
```

### C.2 Hábitos

| Método | Ruta | Descripción |
|---|---|---|
| `GET`  | `/api/habitos` | Devuelve hábitos con `rachaActual` y `completadoHoy` calculados |
| `POST` | `/api/habitos` | Crear hábito |
| `POST` | `/api/habitos/{id}/toggle?fecha=YYYY-MM-DD` | Marcar/desmarcar el día (idempotente) |

**Response `GET /api/habitos`:**
```json
[
  { "id": "h-neat", "titulo": "Actividad NEAT", "area": "salud",
    "rachaActual": 12, "completadoHoy": false, "xpPorCompletar": 8 }
]
```

### C.3 Fitness (Event Sourcing)

| Método | Ruta | Descripción |
|---|---|---|
| `GET`  | `/api/fitness/eventos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` | Historial paginado |
| `POST` | `/api/fitness/eventos` | Append de evento (`NEAT`, `PAUSA_ACTIVA`, `ENTRENAMIENTO`) |
| `GET`  | `/api/fitness/plantillas` | Listar plantillas |
| `POST` | `/api/fitness/plantillas` | Crear plantilla |
| `PUT`  | `/api/fitness/plantillas/{id}` | Editar plantilla (no afecta eventos pasados) |
| `DELETE` | `/api/fitness/plantillas/{id}` | Borrar plantilla |

**POST `/api/fitness/eventos` — Request:**
```json
{ "tipoEvento": "ENTRENAMIENTO", "metricas": "Push — Banca 3x8 70kg", "plantillaId": "pl-push" }
```

### C.4 KPIs (Quantified Self)

| Método | Ruta | Descripción |
|---|---|---|
| `GET`  | `/api/kpis` | Listar definiciones |
| `POST` | `/api/kpis` | Crear KPI |
| `DELETE` | `/api/kpis/{id}` | Borrar KPI (cascade a eventos_kpi) |
| `POST` | `/api/kpis/{id}/eventos` | Append de incremento |
| `GET`  | `/api/kpis/{id}/agregado?vista=DIA\|SEMANA\|MES` | Suma escalada al período |

**POST `/api/kpis/{id}/eventos` — Request:**
```json
{ "cantidad": 2, "fuente": "IA", "nota": "Comí 2 frutas en el almuerzo" }
```

### C.5 Gamificación

| Método | Ruta | Descripción |
|---|---|---|
| `GET`  | `/api/gamificacion/perfil` | Nivel, XP, distribución por área |
| `GET`  | `/api/gamificacion/logros?limit=20` | Logros recientes |

> Los logros se generan **server-side** como side-effect de los endpoints que otorgan XP (tareas completadas, hábitos toggleados, eventos fitness/KPI). El cliente NO escribe directamente en gamificación.

### C.6 IA — Procesador Mágico

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/ia/procesar` | Entrada cruda → intención estructurada |
| `POST` | `/api/ia/resumen-semanal` | Genera el informe ejecutivo compasivo |
| `POST` | `/api/ia/consulta-rapida` | (Opcional v2) Resuelve las Consultas Rápidas del MateBot |

**POST `/api/ia/procesar` — Request:**
```json
{ "texto": "Mañana 9am reunión con el cliente del taller mecánico" }
```
**Response (espejo de `DTO_RespuestaProcesamientoIA`):**
```json
{
  "exito": true,
  "intencion": "AGENDAR_EVENTO",
  "tareaExtraida": "Reunión con cliente del taller mecánico",
  "categoriaSugerida": "Proyecto",
  "tagsDetectados": ["#TallerMecánico", "#Reunión"],
  "confianza": 0.92,
  "requiereAgendamiento": true,
  "fechaSugerida": "2026-05-28",
  "horaSugerida": "09:00",
  "metricasExtraidas": null,
  "cantidadDetectada": null,
  "kpiObjetivoTexto": null
}
```

**Intenciones soportadas:** `AGREGAR_TAREA`, `AGREGAR_NOTA`, `AGENDAR_EVENTO`, `COMPLETAR_TAREA`, `COMPLETAR_HABITO`, `REGISTRAR_RUTINA`, `INCREMENTAR_KPI`.

---

## D. El Escudo Léxico (responsabilidad del backend)

El frontend implementa `src/services/mocks/escudoLexico.ts` como capa cero-latencia que **rechaza entradas inválidas antes de gastar tokens en la LLM**. En producción, esta lógica debe migrar al backend C# como middleware previo a la llamada a **Groq**.

### Contrato funcional

```text
texto crudo ──► [1. Sanitización] ──► [2. Heurística regex] ──► [3. Decisión]
                                                                 │
                                                                 ├─► Match local fuerte ⇒ responder sin llamar a Groq
                                                                 ├─► Match parcial      ⇒ llamar a Groq con prompt enriquecido
                                                                 └─► Rechazo léxico     ⇒ 422 sin llamar a Groq
```

### Implementación sugerida (C# pseudocódigo)

```csharp
public sealed class EscudoLexicoMiddleware
{
    private static readonly Regex IncrementoKpi =
        new(@"\b(?:com[ií]|tom[eé]|hice|sum[eé])\s+(\d+(?:[.,]\d+)?)\s+([a-zñ]+)",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public async Task<IntencionResolucion> EvaluarAsync(string texto)
    {
        if (string.IsNullOrWhiteSpace(texto) || texto.Length > 500)
            return IntencionResolucion.Rechazo("Entrada vacía o demasiado larga");

        // 1) Patrones locales con confianza alta — bypassean a Groq.
        var m = IncrementoKpi.Match(texto);
        if (m.Success)
            return IntencionResolucion.LocalFuerte(new RespuestaIA {
                Intencion = "INCREMENTAR_KPI",
                CantidadDetectada = decimal.Parse(m.Groups[1].Value.Replace(',', '.')),
                KpiObjetivoTexto  = m.Groups[2].Value,
                Confianza = 0.95m
            });

        // 2) Heurísticas adicionales (AGENDAR_EVENTO con "mañana/hoy/HH:mm", etc.).
        // 3) Fallback ⇒ llamar a Groq con prompt sistema fijado.
        return IntencionResolucion.EscalarAGroq(texto);
    }
}
```

### Beneficios

- **Coste**: ~70 % de los inputs frecuentes se resuelven sin LLM.
- **Latencia**: respuestas <10 ms para patrones cubiertos.
- **Seguridad**: filtra prompt injection antes de tocar el modelo.
- **Trazabilidad**: cada respuesta marca `fuente: "LOCAL" | "LLM"`.

---

## E. El Futuro Nativo

> Más adelante, al empaquetar el front con **Tauri** y conectarlo al backend en C#, se compilará una aplicación nativa liviana para Windows/Mac. Esto permitirá soportar la función **"Always on Top"** (Siempre al frente) o que el sistema viva directamente en la barra de tareas (**System Tray**) como un asistente omnipresente.

### Implicaciones técnicas

- El **Modo Compacto** (viewport ≤ 360px) ya implementado en `__root.tsx` se convierte en el **Widget Mode** de la ventana flotante de Tauri: la app se reduce a MateBot + bocadillo, sin nav ni dashboard.
- El **API client** se reemplaza por llamadas HTTP al backend C# alojado en el VPS/Render/Fly; los DTOs son idénticos a los actuales — cero refactor.
- La **Web Speech API** se sustituye por bindings nativos (`tauri-plugin-mic`) cuando se requiera dictado offline.
- El **Service Worker** PWA se mantiene como fallback web; Tauri ignora el SW y carga assets desde el bundle.
- **Atajos globales** (`tauri-plugin-global-shortcut`): `Ctrl+Space` invoca al MateBot desde cualquier app, materializando la promesa de "fricción cero".

---

## Apéndice — Estado actual de las stores

| Store | Patrón | Persistencia (`localStorage`) | Endpoints C# objetivo |
|---|---|---|---|
| `tareasStore` | CRUD | `mateflow.tareas.v2` | `/api/tareas/*` |
| `habitosStore` | CRUD + toggle diario | `mateflow.habitos.v1` | `/api/habitos/*` |
| `fitnessStore` | **Event Sourcing** | `mateflow.fitness.v1` | `/api/fitness/*` |
| `kpisStore` | **Event Sourcing** | `mateflow.kpis.v1` | `/api/kpis/*` |
| `gamificacionStore` | Append (calculada) | `mateflow.gamificacion.v1` | `/api/gamificacion/*` (read-only) |

---

**Documento mantenido por:** Tech Lead Frontend MateFlow.
**Próxima revisión:** al iniciar el sprint de backend C#.
