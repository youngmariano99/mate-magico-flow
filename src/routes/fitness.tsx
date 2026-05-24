import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Footprints, TimerReset, Dumbbell, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { NavegacionPrincipal, BarraInferior } from "@/components/layout/NavegacionPrincipal";
import { GuardiaSesion } from "@/auth/GuardiaSesion";
import { useFitnessStore } from "@/stores/fitnessStore";
import { useGamificacionStore } from "@/stores/gamificacionStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DTO_PlantillaRutina, TipoEventoFisico } from "@/types/dominio";

export const Route = createFileRoute("/fitness")({
  head: () => ({
    meta: [
      { title: "Fitness — MateFlow" },
      { name: "description", content: "Registro ultra rápido de actividad física: NEAT, pausas activas y entrenamientos basados en plantillas." },
      { property: "og:title", content: "Fitness — MateFlow" },
      { property: "og:description", content: "Cuantificación personal con historial inmutable de eventos físicos." },
    ],
  }),
  component: PaginaFitness,
});

function PaginaFitness() {
  return (
    <GuardiaSesion>
      <Contenido />
    </GuardiaSesion>
  );
}

/* -------------------------------------------------------------------------- */

const ETIQUETAS_TIPO: Record<TipoEventoFisico, { label: string; icono: string }> = {
  NEAT: { label: "NEAT", icono: "🚶" },
  PAUSA_ACTIVA: { label: "Pausa activa", icono: "🧘" },
  ENTRENAMIENTO: { label: "Entrenamiento", icono: "🏋️" },
};

function Contenido() {
  const historial = useFitnessStore((s) => s.historialEventos);
  const registrarNEAT = useFitnessStore((s) => s.registrarNEAT);
  const registrarPausa = useFitnessStore((s) => s.registrarPausaActiva);
  const registrarLogro = useGamificacionStore((s) => s.registrarLogro);

  const [modoEntreno, setModoEntreno] = useState<DTO_PlantillaRutina | null>(null);

  const stats = useMemo(() => {
    const hoy = new Date().toISOString().slice(0, 10);
    const deHoy = historial.filter((e) => e.fechaHora.startsWith(hoy));
    const conteoPorTipo: Record<TipoEventoFisico, number> = {
      NEAT: 0,
      PAUSA_ACTIVA: 0,
      ENTRENAMIENTO: 0,
    };
    for (const e of deHoy) conteoPorTipo[e.tipoEvento] += 1;
    const xpHoy = deHoy.reduce((a, e) => a + e.xpOtorgado, 0);
    return { conteoPorTipo, xpHoy, totalHoy: deHoy.length };
  }, [historial]);

  const dispararRapido = (tipo: "NEAT" | "PAUSA_ACTIVA") => {
    const ev = tipo === "NEAT" ? registrarNEAT() : registrarPausa();
    registrarLogro(
      tipo === "NEAT" ? "Caminata NEAT" : "Pausa activa",
      ev.xpOtorgado,
      "Salud",
    );
    toast.success(`${ETIQUETAS_TIPO[tipo].icono} Registrado`, {
      description: `+${ev.xpOtorgado} XP en Salud`,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavegacionPrincipal />
      <main className="mx-auto max-w-5xl px-5 py-8 space-y-10 pb-28 md:pb-20">
        <header>
          <p className="text-sm text-muted-foreground">Quantified Self</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-1">
            Fitness y movimiento
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Cada toque queda registrado como evento inmutable — listo para analítica futura.
          </p>
        </header>

        {/* ----------- Resumen del día ----------- */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI label="NEAT hoy" valor={stats.conteoPorTipo.NEAT} />
          <KPI label="Pausas activas" valor={stats.conteoPorTipo.PAUSA_ACTIVA} />
          <KPI label="Entrenos" valor={stats.conteoPorTipo.ENTRENAMIENTO} />
          <KPI label="XP del día" valor={stats.xpHoy} acento />
        </section>

        {/* ----------- Acciones rápidas ----------- */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Registro rápido
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <BotonRapido
              icon={<Footprints size={28} />}
              titulo="Registrar caminata"
              subtitulo="NEAT · +4 XP"
              onClick={() => dispararRapido("NEAT")}
            />
            <BotonRapido
              icon={<TimerReset size={28} />}
              titulo="Pausa activa"
              subtitulo="5 min movilidad · +3 XP"
              onClick={() => dispararRapido("PAUSA_ACTIVA")}
            />
          </div>
        </section>

        {/* ----------- Plantillas ----------- */}
        <SeccionPlantillas onComenzar={(pl) => setModoEntreno(pl)} />

        {/* ----------- Historial ----------- */}
        <SeccionHistorial />
      </main>

      <Dialog open={modoEntreno !== null} onOpenChange={(o) => !o && setModoEntreno(null)}>
        <DialogContent className="max-w-lg">
          {modoEntreno && (
            <FormularioEntrenamiento
              plantilla={modoEntreno}
              onListo={() => setModoEntreno(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <BarraInferior />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Componentes auxiliares                                                     */
/* -------------------------------------------------------------------------- */

const KPI = ({ label, valor, acento }: { label: string; valor: number; acento?: boolean }) => (
  <div
    className={`surface-card p-4 ${
      acento ? "border-primary/40 bg-primary/5" : ""
    }`}
  >
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`mt-1 font-display text-2xl font-semibold ${acento ? "text-primary" : ""}`}>
      {valor}
    </p>
  </div>
);

const BotonRapido = ({
  icon,
  titulo,
  subtitulo,
  onClick,
}: {
  icon: React.ReactNode;
  titulo: string;
  subtitulo: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group surface-card mate-glow p-5 flex items-center gap-4 text-left hover:border-primary/50 transition-colors active:scale-[0.98]"
  >
    <span className="h-14 w-14 rounded-xl bg-primary/15 text-primary grid place-items-center group-hover:bg-primary/25 transition-colors">
      {icon}
    </span>
    <span className="flex-1">
      <span className="block font-display text-lg font-semibold">{titulo}</span>
      <span className="block text-xs text-muted-foreground mt-0.5">{subtitulo}</span>
    </span>
  </button>
);

/* ----------------------------- Plantillas -------------------------------- */

function SeccionPlantillas({ onComenzar }: { onComenzar: (p: DTO_PlantillaRutina) => void }) {
  const plantillas = useFitnessStore((s) => s.plantillas);
  const crearPlantilla = useFitnessStore((s) => s.crearPlantilla);
  const actualizarPlantilla = useFitnessStore((s) => s.actualizarPlantilla);
  const eliminarPlantilla = useFitnessStore((s) => s.eliminarPlantilla);

  const [crear, setCrear] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Plantillas de rutina
        </h2>
        <button
          type="button"
          onClick={() => setCrear(true)}
          className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Plus size={14} /> Nueva
        </button>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {plantillas.map((p) =>
          editandoId === p.id ? (
            <li key={p.id}>
              <EditorPlantilla
                plantilla={p}
                onCancelar={() => setEditandoId(null)}
                onGuardar={(titulo, ejercicios) => {
                  actualizarPlantilla(p.id, { titulo, ejercicios });
                  setEditandoId(null);
                  toast.success("Plantilla actualizada");
                }}
              />
            </li>
          ) : (
            <li key={p.id} className="surface-card p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg font-semibold">{p.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.ejercicios.length} ejercicios
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditandoId(p.id)}
                    aria-label="Editar plantilla"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      eliminarPlantilla(p.id);
                      toast("Plantilla eliminada", { description: p.titulo });
                    }}
                    aria-label="Eliminar plantilla"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {p.ejercicios.map((e) => (
                  <li
                    key={e}
                    className="text-xs px-2 py-1 rounded-full bg-surface-elevated text-muted-foreground"
                  >
                    {e}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onComenzar(p)}
                className="mt-1 inline-flex items-center justify-center gap-2 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Dumbbell size={14} /> Comenzar entrenamiento
              </button>
            </li>
          ),
        )}

        {crear && (
          <li>
            <EditorPlantilla
              onCancelar={() => setCrear(false)}
              onGuardar={(titulo, ejercicios) => {
                crearPlantilla(titulo, ejercicios);
                setCrear(false);
                toast.success("Plantilla creada", { description: titulo });
              }}
            />
          </li>
        )}
      </ul>
    </section>
  );
}

function EditorPlantilla({
  plantilla,
  onCancelar,
  onGuardar,
}: {
  plantilla?: DTO_PlantillaRutina;
  onCancelar: () => void;
  onGuardar: (titulo: string, ejercicios: ReadonlyArray<string>) => void;
}) {
  const [titulo, setTitulo] = useState(plantilla?.titulo ?? "");
  const [ejercicios, setEjercicios] = useState<string>(
    plantilla?.ejercicios.join(", ") ?? "",
  );

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const t = titulo.trim();
    const lista = ejercicios
      .split(",")
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
    if (!t || lista.length === 0) return;
    onGuardar(t, lista);
  };

  return (
    <form onSubmit={enviar} className="surface-card p-4 space-y-3 border-primary/40">
      <input
        autoFocus
        required
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título (ej: Día de Piernas)"
        className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-primary/50"
      />
      <textarea
        required
        rows={2}
        value={ejercicios}
        onChange={(e) => setEjercicios(e.target.value)}
        placeholder="Ejercicios separados por coma"
        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/50 resize-none"
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancelar}
          className="inline-flex items-center gap-1 h-9 px-3 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground"
        >
          <X size={14} /> Cancelar
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-1 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
        >
          <Check size={14} /> Guardar
        </button>
      </div>
    </form>
  );
}

/* ----------------------------- Entrenamiento ----------------------------- */

function FormularioEntrenamiento({
  plantilla,
  onListo,
}: {
  plantilla: DTO_PlantillaRutina;
  onListo: () => void;
}) {
  const registrarEntrenamiento = useFitnessStore((s) => s.registrarEntrenamiento);
  const registrarLogro = useGamificacionStore((s) => s.registrarLogro);
  const [detalles, setDetalles] = useState<Array<{ ejercicio: string; serie: string }>>(
    plantilla.ejercicios.map((e) => ({ ejercicio: e, serie: "" })),
  );

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const ev = registrarEntrenamiento({ plantillaId: plantilla.id, detalles });
    registrarLogro(`Entrenamiento — ${plantilla.titulo}`, ev.xpOtorgado, "Salud");
    toast.success("🏋️ Entrenamiento registrado", {
      description: `+${ev.xpOtorgado} XP en Salud`,
    });
    onListo();
  };

  return (
    <form onSubmit={enviar} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{plantilla.titulo}</DialogTitle>
        <DialogDescription>
          Anotá series y peso por ejercicio. Vacíos se ignoran.
        </DialogDescription>
      </DialogHeader>
      <ul className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {detalles.map((d, i) => (
          <li key={`${d.ejercicio}-${i}`} className="grid grid-cols-[1fr_1.4fr] gap-2 items-center">
            <span className="text-sm font-medium truncate">{d.ejercicio}</span>
            <input
              value={d.serie}
              onChange={(e) =>
                setDetalles((prev) =>
                  prev.map((x, idx) => (idx === i ? { ...x, serie: e.target.value } : x)),
                )
              }
              placeholder="3x10 60kg"
              className="h-9 rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-primary/50"
            />
          </li>
        ))}
      </ul>
      <button
        type="submit"
        className="w-full h-11 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
      >
        Registrar entrenamiento
      </button>
    </form>
  );
}

/* ----------------------------- Historial -------------------------------- */

function SeccionHistorial() {
  const historial = useFitnessStore((s) => s.historialEventos);
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Historial inmutable
      </h2>
      {historial.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay eventos.</p>
      ) : (
        <ol className="space-y-2">
          {historial.slice(0, 20).map((e) => {
            const fecha = new Date(e.fechaHora);
            const meta = ETIQUETAS_TIPO[e.tipoEvento];
            return (
              <li key={e.id} className="surface-card p-3 flex items-center gap-3">
                <span className="text-xl" aria-hidden>
                  {meta.icono}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{e.metricas}</p>
                  <p className="text-xs text-muted-foreground">
                    {meta.label} ·{" "}
                    {fecha.toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="text-xs font-mono text-primary">+{e.xpOtorgado} XP</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
