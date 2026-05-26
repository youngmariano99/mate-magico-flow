import type { CategoriaPARA, IntencionIA } from "@/types/dominio";

/**
 * Escudo Léxico — Filtro Anti-Alucinaciones (mock backend).
 *
 * Es una capa pura de validación que decide si una entrada del usuario
 * pertenece al dominio de MateFlow (tareas, notas, agenda, hábitos, rutinas).
 *
 * Resultados posibles:
 *  - "rechazado": la petición no encaja en el dominio (0 ms de latencia).
 *  - "ambiguo":   parece tener intención pero falta un verbo gatillo claro.
 *  - "aprobado":  la entrada se mapea a una `IntencionIA` reconocida.
 */

export type ResultadoEscudo =
  | { tipo: "rechazado"; razon: string }
  | { tipo: "ambiguo"; sugerencia: string; intencionTentativa: IntencionIA }
  | { tipo: "aprobado"; analisis: AnalisisIntencion };

export interface AnalisisIntencion {
  intencion: IntencionIA;
  categoria: CategoriaPARA;
  tags: string[];
  confianza: number;
  requiereAgendamiento: boolean;
  fechaSugerida?: string;
  horaSugerida?: string;
  metricasExtraidas?: string;
  /** Para INCREMENTAR_KPI: cantidad numérica extraída. */
  cantidadDetectada?: number;
  /** Para INCREMENTAR_KPI: sustantivo objetivo (lo que se incrementa). */
  kpiObjetivoTexto?: string;
}

/** Lista blanca de palabras gatillo aceptadas por el sistema. */
const VERBOS_VALIDOS = [
  "agendar", "agenda", "recordar", "recordame", "anotar", "anota",
  "idea", "nota", "pensar", "tarea", "comprar", "pagar",
  "entrenar", "entreno", "rutina", "correr", "corri", "trote",
  "termine", "terminé", "complete", "completé", "hice", "logre", "logré",
  "habito", "hábito", "leer", "estudiar", "facu", "tp", "parcial",
  "lanzar", "implementar", "construir", "diseñar", "diseno",
  // Verbos de Quantified Self / KPIs incrementales
  "comi", "comí", "tome", "tomé", "bebí", "bebi", "sume", "sumé",
  "registr", "anote", "anoté", "consumí", "consumi",
];

const PALABRAS_FUERA_DOMINIO = [
  /\b(haz|crea|genera|gener[aá]|dibuj[aá]|pint[aá])\s+(me\s+)?una?\s+(imagen|foto|dibujo|video|cancion|canci[oó]n|m[uú]sica|poema|cuento)/i,
  /\b(traduc[ií]|c[oó]digo|programame|chiste|cuento|escrib[ií] (una|un) (carta|email))\b/i,
  /\b(clima|temperatura|cotizaci[oó]n|d[oó]lar|noticias)\b/i,
];

const REGEX_HORA = /\b(\d{1,2})(?::(\d{2}))?\s?(hs|h|am|pm)?\b/i;
const REGEX_FECHA_REL = /\b(hoy|mañana|manana|pasado mañana|pasado manana|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/i;
const REGEX_METRICAS = /(\d+\s?(x|por)\s?\d+|\d+\s?(kg|km|m|min|reps|series|series|sets))/i;
/** Captura: cantidad + sustantivo objetivo (frutas, vasos de agua, pausas, etc.). */
const REGEX_INCREMENTO_KPI = /\b(?:com[ií]|tom[eé]|beb[ií]|hice|sum[eé]|anot[eé]|consum[ií]|registr[eé]?)\s+(\d+(?:[.,]\d+)?)\s+([a-záéíóúñ]+(?:\s+(?:de|activas?|de\s+agua))?)/i;

const contienePalabra = (texto: string, lista: ReadonlyArray<string>): boolean => {
  const lower = texto.toLowerCase();
  return lista.some((p) => new RegExp(`\\b${p}\\b`, "i").test(lower));
};

const calcularFechaRelativa = (token: string): string => {
  const base = new Date();
  const t = token.toLowerCase();
  if (t === "hoy") return base.toISOString().slice(0, 10);
  if (t.startsWith("ma")) {
    base.setDate(base.getDate() + 1);
    return base.toISOString().slice(0, 10);
  }
  if (t.startsWith("pasado")) {
    base.setDate(base.getDate() + 2);
    return base.toISOString().slice(0, 10);
  }
  // Día de la semana
  const dias = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  const normalizado = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const idx = dias.indexOf(normalizado);
  if (idx >= 0) {
    const delta = (idx - base.getDay() + 7) % 7 || 7;
    base.setDate(base.getDate() + delta);
    return base.toISOString().slice(0, 10);
  }
  return base.toISOString().slice(0, 10);
};

const extraerHora = (texto: string): string | undefined => {
  const m = REGEX_HORA.exec(texto);
  if (!m) return undefined;
  const h = Math.min(23, Math.max(0, Number(m[1])));
  const min = m[2] ? Math.min(59, Number(m[2])) : 0;
  const sufijo = (m[3] ?? "").toLowerCase();
  let hora = h;
  if (sufijo === "pm" && h < 12) hora = h + 12;
  if (sufijo === "am" && h === 12) hora = 0;
  return `${String(hora).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
};

const inferirIntencion = (texto: string): IntencionIA => {
  const t = texto.toLowerCase();
  // INCREMENTAR_KPI tiene prioridad: requiere número + verbo de consumo.
  if (REGEX_INCREMENTO_KPI.test(t) && !/\b(entren[oé]|rutina|sentadill|press|peso muerto|gym)\b/.test(t)) {
    return "INCREMENTAR_KPI";
  }
  if (/\b(termin[eé]|complet[eé]|hice|logr[eé])\b/.test(t)) {
    if (/\b(habito|hábito|rutina diaria|neat)\b/.test(t)) return "COMPLETAR_HABITO";
    return "COMPLETAR_TAREA";
  }
  if (/\b(entren[oé]|rutina|corr[ií]|trote|sentadill|press|peso muerto|gym)\b/.test(t)) return "REGISTRAR_RUTINA";
  if (/\b(agendar|agenda|reuni[oó]n|cita|turno|llamado)\b/.test(t) || REGEX_FECHA_REL.test(t) || REGEX_HORA.test(t)) return "AGENDAR_EVENTO";
  if (/\b(idea|nota|anotar|pensar|pensamiento|reflexi[oó]n)\b/.test(t)) return "AGREGAR_NOTA";
  return "AGREGAR_TAREA";
};

const inferirCategoria = (texto: string, intencion: IntencionIA): CategoriaPARA => {
  if (intencion === "AGREGAR_NOTA") return "Recurso";
  if (intencion === "REGISTRAR_RUTINA" || intencion === "COMPLETAR_HABITO") return "Area";
  const t = texto.toLowerCase();
  if (/\b(lanzar|construir|implementar|dise[ñn]ar|proyecto|tp|parcial|materia)\b/.test(t)) return "Proyecto";
  if (/\b(leer|libro|art[ií]culo|curso|video|apuntes)\b/.test(t)) return "Recurso";
  if (/\b(archivar|viejo|hist[oó]rico)\b/.test(t)) return "Archivo";
  return "Area";
};

const inferirTags = (texto: string): string[] => {
  const t = texto.toLowerCase();
  const tags: string[] = [];
  if (/\b(salud|gym|entren|nutrici[oó]n|m[eé]dico|correr|trote)\b/.test(t)) tags.push("Salud");
  if (/\b(finanzas|plata|sueldo|gasto|pagar|comprar)\b/.test(t)) tags.push("Finanzas");
  if (/\b(facu|utn|tp|parcial|materia|estudiar)\b/.test(t)) tags.push("Facultad");
  if (/\b(ingl[eé]s|idioma|franc[eé]s)\b/.test(t)) tags.push("Idiomas");
  if (/\b(mateflow|landing|backend|frontend|c#|c sharp|csharp|postgres)\b/.test(t)) tags.push("Build");
  return tags.length ? tags : ["General"];
};

/**
 * Punto de entrada del Escudo Léxico.
 * Precondición: `texto` ya viene `.trim()`-eado.
 */
export const validarIntencionUsuario = (texto: string): ResultadoEscudo => {
  // 1) Rechazo instantáneo: peticiones claramente fuera de dominio.
  for (const patron of PALABRAS_FUERA_DOMINIO) {
    if (patron.test(texto)) {
      return {
        tipo: "rechazado",
        razon: "Solo gestiono tareas, proyectos, notas, agenda, hábitos y rutinas.",
      };
    }
  }

  // 2) Ambigüedad: pensamiento suelto sin verbo gatillo reconocido.
  const tieneVerbo = contienePalabra(texto, VERBOS_VALIDOS);
  if (!tieneVerbo) {
    // Si parece una reflexión libre, sugerimos convertirla en nota.
    if (/\b(pensamiento|reflexi[oó]n|me parece|tengo ganas)\b/i.test(texto)) {
      return {
        tipo: "ambiguo",
        sugerencia: "¿Quisiste decir '💡 Nueva Idea:'?",
        intencionTentativa: "AGREGAR_NOTA",
      };
    }
    // Texto demasiado vago.
    return {
      tipo: "rechazado",
      razon: "No reconozco la intención. Probá con: agendar, recordar, idea, comprar, entrené…",
    };
  }

  // 3) Aprobado: extraer estructura.
  const intencion = inferirIntencion(texto);
  const categoria = inferirCategoria(texto, intencion);
  const tags = inferirTags(texto);

  const fechaToken = REGEX_FECHA_REL.exec(texto)?.[1];
  const fechaSugerida = fechaToken ? calcularFechaRelativa(fechaToken) : undefined;
  const horaSugerida = extraerHora(texto);
  const metricasMatch = REGEX_METRICAS.exec(texto)?.[0];

  // Extracción específica para INCREMENTAR_KPI.
  let cantidadDetectada: number | undefined;
  let kpiObjetivoTexto: string | undefined;
  if (intencion === "INCREMENTAR_KPI") {
    const m = REGEX_INCREMENTO_KPI.exec(texto);
    if (m) {
      cantidadDetectada = Number(m[1].replace(",", "."));
      kpiObjetivoTexto = m[2].trim().toLowerCase();
    }
  }

  const requiereAgendamiento =
    intencion === "AGENDAR_EVENTO" || Boolean(fechaSugerida) || Boolean(horaSugerida);

  return {
    tipo: "aprobado",
    analisis: {
      intencion,
      categoria,
      tags,
      confianza: 0.88,
      requiereAgendamiento,
      fechaSugerida,
      horaSugerida,
      metricasExtraidas: metricasMatch,
      cantidadDetectada,
      kpiObjetivoTexto,
    },
  };
};
