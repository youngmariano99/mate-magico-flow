# MateFlow — ARCHITECTURE.md

> Blueprint técnico para construir el backend en **C# .NET Minimal APIs** + **PostgreSQL** con acople perfecto al frontend ya implementado.
> Audiencia: ingenieros backend / arquitectos / IA generadora de código.
> Filosofía del producto: **fricción cero** — el usuario habla, el sistema clasifica, persiste y devuelve XP.

---

## 1. Stack Tecnológico del Frontend

| Capa | Tecnología | Propósito |
|---|---|---|
| Lenguaje | **TypeScript 5 (strict)** | Tipado total. Prohibido `any`. DTOs como contrato con backend. |
| UI Framework | **React 19** | Componentes funcionales + hooks. Sin clases. |
| Bundler / SSR | **Vite 7 + TanStack Start** | File-based routing en `src/routes/`, SSR opcional, code-splitting automático. |
| Routing | **@tanstack/react-router** | Tipado end-to-end de params, search, loaders. |
| Estado global | **Zustand + middleware `persist`** | Stores atómicos por dominio (tareas, hábitos, gamificación). Hidratación desde `localStorage`. |
| Estilos | **Tailwind CSS v4** | Tokens semánticos en `src/styles.css` (`oklch`). Sin colores hardcodeados. |
| Componentes base | **shadcn/ui + Radix UI** | Dialog, Sheet, Tabs, etc. Accesibles y temabilizables. |
| Drag & Drop | **@hello-pangea/dnd** | Reordenamiento de MITs y backlog → días en Planificación. |
| Notificaciones | **Sonner** | Toasts unificados (loading / success / error) para feedback del Procesador Mágico. |
| PWA | **vite-plugin-pwa** | `manifest.webmanifest` + service worker (deshabilitado en preview). |
| Auth (mock) | `AuthProvider` propio | Forma `Session` compatible con Supabase Auth para futura migración. |
| Linting | ESLint + Prettier | Reglas estrictas, formateo consistente. |

---

## 2. Arquitectura y Estándares de Código

### 2.1 Separación de Responsabilidades (SRP)

```text
src/
├── routes/              # Pages (TanStack file-based routing)
├── components/          # UI pura — presentación, sin fetching ni reglas
│   ├── dashboard/
│   ├── baul/
│   ├── planificacion/
│   ├── evolucion/
│   └── layout/
├── hooks/               # Orquestación: useTareas, useHabitos, useProcesadorMagico
├── stores/              # Zustand: tareasStore, habitosStore, gamificacionStore
├── services/mocks/      # Adapter: simula latencia + responde DTOs (futuro: HTTP client)
│   └── escudoLexico.ts  # Servicio puro (sin React, sin Zustand)
├── auth/                # AuthProvider + GuardiaSesion
└── types/dominio.ts     # Contratos DTO_*
```

**Regla de oro:** un componente nunca toca el store directamente para mutar; siempre va a través de un hook (`useTareas.crear()`, etc.). Los hooks nunca contienen reglas de validación: las delegan al servicio (`escudoLexico.ts`).

### 2.2 Patrón Adapter (`src/services/mocks/`)

Hoy los stores Zustand contienen funciones `async` con `setTimeout(350ms)` que **emulan latencia de red**. La firma de cada método es idéntica a la del futuro endpoint REST:

```typescript
// HOY (mock)
agregar: (entrada: Omit<DTO_Tarea, "id" | "fechaCreacion" | "estado">) => Promise<DTO_Tarea>;

// MAÑANA (HTTP)
agregar: (entrada) => fetch("/api/tareas", { method: "POST", body: JSON.stringify(entrada) }).then(r => r.json());
```

Migrar al backend C# **no requiere tocar ni un solo componente de UI** — únicamente reemplazar el cuerpo de las funciones del store por llamadas `fetch`.

### 2.3 Corralito de Tipado

- `strict: true` + `noImplicitAny` + `noUncheckedIndexedAccess`.
- Prohibición absoluta de `any`. Donde una librería externa lo introduzca, se acota con `unknown` + type guard.
- Los DTOs en `src/types/dominio.ts` son **el único contrato** con el backend. Cualquier respuesta del servidor debe validarse contra ellos (futuro: `zod` runtime parsers).
- Las uniones discriminadas (`IntencionIA`, `CategoriaPARA`, `EstadoTarea`) habilitan exhaustividad en `switch` — agregar una nueva intención falla la compilación hasta tratarla en el Dashboard.

---

## 3. Modelo de Datos y Diseño de Base de Datos (PostgreSQL)

### 3.1 DTOs del Frontend (espejo a respetar)

```typescript
type CategoriaPARA = "Proyecto" | "Area" | "Recurso" | "Archivo";
type EstadoTarea   = "Activa" | "Completada" | "Archivada";

type IntencionIA =
  | "AGREGAR_TAREA" | "AGREGAR_NOTA" | "AGENDAR_EVENTO"
  | "COMPLETAR_TAREA" | "COMPLETAR_HABITO" | "REGISTRAR_RUTINA";

interface DTO_Tarea {
  id: string;
  titulo: string;
  categoria: CategoriaPARA;
  areaVinculadaId?: string;
  estado: EstadoTarea;
  fechaCreacion: string;      // ISO 8601
  puntosExperiencia: number;
  fechaProgramada?: string | null;  // YYYY-MM-DD
  etiquetas?: ReadonlyArray<string>;
  notasMarkdown?: string;
}

interface DTO_Habito {
  id: string;
  titulo: string;
  area: string;
  rachaActual: number;
  completadoHoy: boolean;
  xpPorCompletar: number;
}

interface DTO_PerfilGamificacion {
  nivel: number;
  xpActual: number;
  xpParaSiguienteNivel: number;
  xpPorArea: ReadonlyArray<{ area: string; xp: number }>;
  logrosRecientes: ReadonlyArray<{ id: string; descripcion: string; xp: number; fecha: string }>;
}

interface DTO_RespuestaProcesamientoIA {
  exito: boolean;
  intencion: IntencionIA;
  tareaExtraida: string;
  categoriaSugerida: CategoriaPARA;
  tagsDetectados: string[];
  confianza: number;            // 0.0 .. 1.0
  requiereAgendamiento: boolean;
  fechaSugerida?: string;       // YYYY-MM-DD
  horaSugerida?: string;        // HH:mm
  metricasExtraidas?: string;
  objetivoId?: string;
}

interface DTO_Usuario {
  id: string; email: string; nombreCompleto: string;
  avatarUrl: string | null; zonaHoraria: string; fechaRegistro: string;
}
```

### 3.2 DER Conceptual

```text
usuarios ──┬──< areas
           ├──< proyectos
           ├──< tareas >── areas (FK)
           │       └──< tareas_etiquetas >── etiquetas
           ├──< habitos
           │       └──< habitos_registros (diarios)
           ├──< logros (XP events)
           ├──< rutinas_registros (entrenos con métricas JSONB)
           └──── perfil_gamificacion (1:1)

recursos (notas Segundo Cerebro) >── usuarios
                                  >── embeddings (pgvector)  [RAG futuro]
```

### 3.3 Esquema SQL Sugerido

```sql
-- Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS vector;     -- pgvector para RAG semántico

-- Enums (espejo de las uniones TS)
CREATE TYPE categoria_para AS ENUM ('Proyecto', 'Area', 'Recurso', 'Archivo');
CREATE TYPE estado_tarea   AS ENUM ('Activa', 'Completada', 'Archivada');
CREATE TYPE intencion_ia   AS ENUM (
  'AGREGAR_TAREA', 'AGREGAR_NOTA', 'AGENDAR_EVENTO',
  'COMPLETAR_TAREA', 'COMPLETAR_HABITO', 'REGISTRAR_RUTINA'
);

-- Usuarios (alineado con Supabase Auth: id = auth.users.id)
CREATE TABLE usuarios (
  id              UUID PRIMARY KEY,
  email           CITEXT UNIQUE NOT NULL,
  nombre_completo TEXT NOT NULL,
  avatar_url      TEXT,
  zona_horaria    TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
  fecha_registro  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Áreas de vida (Salud, Finanzas, Facultad, Idiomas, MateFlow, …)
CREATE TABLE areas (
  id          TEXT PRIMARY KEY,          -- slug: 'salud', 'finanzas'
  usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  color_hex   TEXT
);

-- Proyectos (subset de "Categoria=Proyecto" con metadata extra)
CREATE TABLE proyectos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  area_id         TEXT REFERENCES areas(id),
  titulo          TEXT NOT NULL,
  descripcion     TEXT,
  fecha_objetivo  DATE,
  fecha_creacion  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tareas (tabla central — espejo de DTO_Tarea)
CREATE TABLE tareas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id          UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo              TEXT NOT NULL,
  categoria           categoria_para NOT NULL,
  area_vinculada_id   TEXT REFERENCES areas(id),
  proyecto_id         UUID REFERENCES proyectos(id) ON DELETE SET NULL,
  estado              estado_tarea NOT NULL DEFAULT 'Activa',
  fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_programada    DATE,                              -- NULL = backlog
  puntos_experiencia  INT NOT NULL DEFAULT 10,
  notas_markdown      TEXT,
  orden_mit           INT,                               -- orden manual en Dashboard
  CHECK (puntos_experiencia >= 0)
);
CREATE INDEX idx_tareas_usuario_estado ON tareas(usuario_id, estado);
CREATE INDEX idx_tareas_programada     ON tareas(usuario_id, fecha_programada);

-- Etiquetas (Segundo Cerebro)
CREATE TABLE etiquetas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  UNIQUE (usuario_id, nombre)
);
CREATE TABLE tareas_etiquetas (
  tarea_id    UUID NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  etiqueta_id UUID NOT NULL REFERENCES etiquetas(id) ON DELETE CASCADE,
  PRIMARY KEY (tarea_id, etiqueta_id)
);

-- Hábitos atómicos
CREATE TABLE habitos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id        UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo            TEXT NOT NULL,
  area_id           TEXT REFERENCES areas(id),
  xp_por_completar  INT NOT NULL DEFAULT 5,
  racha_actual      INT NOT NULL DEFAULT 0,
  fecha_creacion    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Registros diarios (1 row por hábito por día → permite calcular rachas reales)
CREATE TABLE habitos_registros (
  habito_id     UUID NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
  fecha         DATE NOT NULL,
  completado    BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (habito_id, fecha)
);

-- Rutinas de entrenamiento (intención REGISTRAR_RUTINA)
CREATE TABLE rutinas_registros (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha           TIMESTAMPTZ NOT NULL DEFAULT now(),
  texto_original  TEXT NOT NULL,                       -- "Terminé rutina 2x5 sentadillas 80kg"
  metricas        JSONB NOT NULL                        -- {ejercicios:[{nombre,series,reps,kg}], distancia_km, tiempo_min}
);
CREATE INDEX idx_rutinas_metricas ON rutinas_registros USING GIN (metricas);

-- Recursos / Notas del Segundo Cerebro (con RAG)
CREATE TABLE recursos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo          TEXT NOT NULL,
  contenido_md    TEXT NOT NULL,
  fecha_creacion  TIMESTAMPTZ NOT NULL DEFAULT now(),
  embedding       VECTOR(1536)                          -- pgvector, OpenAI/Groq embeddings
);
CREATE INDEX idx_recursos_embedding ON recursos
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Gamificación
CREATE TABLE perfil_gamificacion (
  usuario_id                UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  nivel                     INT NOT NULL DEFAULT 1,
  xp_actual                 INT NOT NULL DEFAULT 0,
  xp_para_siguiente_nivel   INT NOT NULL DEFAULT 100
);

CREATE TABLE xp_por_area (
  usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  area_id     TEXT NOT NULL REFERENCES areas(id),
  xp_total    INT NOT NULL DEFAULT 0,
  PRIMARY KEY (usuario_id, area_id)
);

CREATE TABLE logros (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  descripcion  TEXT NOT NULL,
  xp           INT NOT NULL,
  area_id      TEXT REFERENCES areas(id),
  fecha        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_logros_usuario_fecha ON logros(usuario_id, fecha DESC);
```

### 3.4 Notas de Diseño BD

- **JSONB en `rutinas_registros.metricas`**: el formato de las métricas evolucionará rápido (powerlifting, running, ciclismo). JSONB + índice GIN permite consultas estructuradas sin migraciones.
- **`pgvector`**: cada nota del Segundo Cerebro genera un embedding al guardar/editar. Búsqueda semántica vía `ORDER BY embedding <=> $query`. Necesario para el futuro RAG "preguntale a tu segundo cerebro".
- **`fecha_programada DATE NULL`**: única columna que separa Backlog (NULL) de Calendario Semanal (con fecha).
- **`auth.users.id` = `usuarios.id`**: si el backend C# se monta sobre Supabase Auth, el FK es directo. Si no, `usuarios.id` es el UUID emitido por el IdP propio.

---

## 4. Contratos de API (Especificación para Backend C# .NET Minimal APIs)

Convenciones:
- Base URL: `/api/v1`
- Auth: `Authorization: Bearer <jwt>` en todas las rutas excepto `/auth/*`.
- Códigos: `200` OK, `201` Created, `400` Validation, `401` Unauthorized, `404` Not Found, `422` Lexical Shield Rejection.
- Latencia tolerada por la UI: ~350 ms (mock actual). Excederla degrada UX.

### 4.1 Tareas

| Método | Ruta | Mock equivalente |
|---|---|---|
| `GET`    | `/api/v1/tareas` | `obtenerTodas()` |
| `GET`    | `/api/v1/tareas?estado=Activa` | `obtenerActivas()` |
| `GET`    | `/api/v1/tareas?categoria=Proyecto` | `obtenerPorCategoria()` |
| `POST`   | `/api/v1/tareas` | `agregar()` |
| `PATCH`  | `/api/v1/tareas/{id}/estado` | `cambiarEstado()` |
| `PATCH`  | `/api/v1/tareas/{id}/agenda` | `moverTarea()` |
| `PATCH`  | `/api/v1/tareas/{id}/notas` | `actualizarNotas()` |
| `PUT`    | `/api/v1/tareas/mits/orden` | `reordenarMITs()` |

**POST /api/v1/tareas — Request:**
```json
{
  "titulo": "Terminar TP de Algoritmos",
  "categoria": "Proyecto",
  "areaVinculadaId": "facultad",
  "puntosExperiencia": 40,
  "etiquetas": ["UTN", "Algoritmos"],
  "notasMarkdown": "## Objetivo..."
}
```
**Response 201 — debe matchear `DTO_Tarea` exactamente:**
```json
{
  "id": "a3f0...",
  "titulo": "Terminar TP de Algoritmos",
  "categoria": "Proyecto",
  "areaVinculadaId": "facultad",
  "estado": "Activa",
  "fechaCreacion": "2026-05-23T14:32:01.000Z",
  "puntosExperiencia": 40,
  "fechaProgramada": null,
  "etiquetas": ["UTN", "Algoritmos"],
  "notasMarkdown": "## Objetivo..."
}
```

### 4.2 Endpoint Crítico: Procesamiento Mágico (IA)

**Ruta:** `POST /api/v1/ia/procesar`
**Controlador:** `MagicInputController.Procesar`

**Request:**
```json
{ "textoCrudo": "Terminé rutina 2x5 sentadillas 80kg" }
```

**Response 200 — `DTO_RespuestaProcesamientoIA`:**
```json
{
  "exito": true,
  "intencion": "REGISTRAR_RUTINA",
  "tareaExtraida": "Terminé rutina 2x5 sentadillas 80kg",
  "categoriaSugerida": "Area",
  "tagsDetectados": ["Salud"],
  "confianza": 0.91,
  "requiereAgendamiento": false,
  "metricasExtraidas": "2x5 sentadillas 80kg"
}
```

**Response 422 — Rechazo del Escudo Léxico:**
```json
{
  "exito": false,
  "razon": "Solo gestiono tareas, proyectos, notas, agenda, hábitos y rutinas.",
  "tipo": "RECHAZADO"
}
```

#### Pipeline obligatorio del backend C#

El frontend ya tiene un mock del Escudo (`src/services/mocks/escudoLexico.ts`) que es la **referencia funcional canónica**. El backend debe replicar el pipeline:

```text
        ┌────────────────────────────────────────────────┐
POST ──▶│ 1. Validación HTTP (FluentValidation)          │
        │    - textoCrudo no vacío, max 500 chars        │
        └────────────────────────────────────────────────┘
                          ▼
        ┌────────────────────────────────────────────────┐
        │ 2. ESCUDO LÉXICO (síncrono, 0 ms)              │
        │    - Regex blacklist: "haz una imagen", etc.   │
        │    - Whitelist de verbos: agendar, comprar, …  │
        │    - Si falla → 422 inmediato (NO llama a IA)  │
        └────────────────────────────────────────────────┘
                          ▼ (aprobado)
        ┌────────────────────────────────────────────────┐
        │ 3. CLIENTE GROQ (HttpClient + Polly retry)     │
        │    - Modelo: llama-3.1-70b-versatile           │
        │    - System prompt: schema JSON estricto       │
        │    - response_format: { type: "json_object" }  │
        └────────────────────────────────────────────────┘
                          ▼
        ┌────────────────────────────────────────────────┐
        │ 4. POST-VALIDACIÓN del JSON de Groq            │
        │    - Deserializar a DTO_RespuestaProcesamientoIA│
        │    - Si `intencion` no está en el enum → 422   │
        │    - Defensa contra alucinaciones de campos    │
        └────────────────────────────────────────────────┘
                          ▼
        ┌────────────────────────────────────────────────┐
        │ 5. Audit log en tabla `ia_procesamientos`      │
        │    (texto_crudo, respuesta_json, latencia_ms)  │
        └────────────────────────────────────────────────┘
                          ▼
                       200 OK
```

> **Importante:** el endpoint **NO muta estado**. Solo clasifica. La mutación efectiva (insert en `tareas`, `habitos_registros`, `rutinas_registros`, …) la dispara el frontend en un segundo round-trip tras la confirmación del usuario en el `ModalConfirmacionMagica`. Esto preserva el flujo Human-in-the-loop.

### 4.3 Hábitos

| Método | Ruta | Mock |
|---|---|---|
| `GET`   | `/api/v1/habitos` | `useHabitosStore.habitos` |
| `POST`  | `/api/v1/habitos/{id}/toggle` | `alternarEstadoHabito()` |
| `POST`  | `/api/v1/habitos/reset-diario` | `resetearDia()` (job nocturno, no endpoint en prod) |

**POST /api/v1/habitos/{id}/toggle — Response:**
```json
{
  "id": "h-neat",
  "titulo": "Actividad NEAT",
  "area": "salud",
  "rachaActual": 13,
  "completadoHoy": true,
  "xpPorCompletar": 8
}
```

### 4.4 Gamificación

| Método | Ruta | Mock |
|---|---|---|
| `GET`   | `/api/v1/gamificacion/perfil` | `useGamificacionStore.perfil` |
| `POST`  | `/api/v1/gamificacion/logros` | `registrarLogro()` |

**POST /api/v1/gamificacion/logros — Request:**
```json
{ "descripcion": "Rutina completada", "xp": 20, "area": "Salud" }
```
**Response 200 — `DTO_PerfilGamificacion` actualizado** (la UI re-renderiza el `PanelGamificacion` con la respuesta).

### 4.5 Auth

| Método | Ruta | Notas |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Body: `{ email, password }` → `DTO_Sesion` |
| `POST` | `/api/v1/auth/logout` | Invalida refresh token |
| `POST` | `/api/v1/auth/refresh` | Rota access token |
| `GET`  | `/api/v1/auth/me` | `DTO_Usuario` del JWT |

`DTO_Sesion` es deliberadamente compatible con Supabase para permitir migrar a Supabase Auth sin tocar `AuthProvider`.

---

## 5. Checklist de Acople Frontend ↔ Backend

- [ ] Todos los nombres de campos en las respuestas JSON usan **camelCase** (no snake_case) — la UI no transforma.
- [ ] Enums (`categoria`, `estado`, `intencion`) devuelven el **string exacto** del enum TS (case-sensitive).
- [ ] Fechas: `ISO 8601 UTC` para timestamps, `YYYY-MM-DD` para `fechaProgramada`.
- [ ] El endpoint `/api/v1/ia/procesar` **nunca** persiste — solo clasifica.
- [ ] El Escudo Léxico vive en el backend y rechaza con `422` antes de gastar tokens de Groq.
- [ ] Toda mutación devuelve la entidad completa (no `204 No Content`) para que Zustand reemplace el item sin re-fetch.

---

**Fin del documento.** Este blueprint es suficiente para iniciar el sprint de backend sin reuniones de aclaración.
