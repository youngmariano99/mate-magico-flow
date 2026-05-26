import { useState } from "react";
import { Plus, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { useKpisStore } from "@/stores/kpisStore";
import { useKPIsAgrupados, type VistaTemporal } from "@/hooks/useMetricasAgregadas";
import { AnilloProgresoKPI } from "./AnilloProgresoKPI";
import type { FrecuenciaKPI } from "@/types/dominio";

const VISTAS: ReadonlyArray<{ id: VistaTemporal; label: string }> = [
  { id: "DIA", label: "Día" },
  { id: "SEMANA", label: "Semana" },
  { id: "MES", label: "Mes" },
];

export const PanelKPIs = () => {
  const grupos = useKPIsAgrupados();
  const eliminarKPI = useKpisStore((s) => s.eliminarKPI);
  const [vista, setVista] = useState<VistaTemporal>("DIA");
  const [creando, setCreando] = useState(false);

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quantified Self
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold mt-1">
            KPIs personales
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cada toque queda registrado como evento. Cambiá la vista para ver progreso a largo plazo.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Vista temporal"
          className="inline-flex items-center gap-1 rounded-full bg-surface border border-border p-1"
        >
          {VISTAS.map((v) => {
            const activo = v.id === vista;
            return (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={activo}
                onClick={() => setVista(v.id)}
                className={`px-4 py-1.5 text-sm rounded-full transition-all duration-300 ${
                  activo
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCreando(true)}
          className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Plus size={14} /> Nuevo KPI
        </button>
      </div>

      {creando && <FormularioNuevoKPI onCerrar={() => setCreando(false)} />}

      {grupos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no creaste KPIs. Tocá <em>Nuevo KPI</em> para empezar.
        </p>
      ) : (
        grupos.map(({ grupo, kpis }) => (
          <section key={grupo} className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {grupo}
            </h3>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {kpis.map((k) => (
                <li key={k.id} className="relative group">
                  <AnilloProgresoKPI kpi={k} vista={vista} />
                  <button
                    type="button"
                    onClick={() => {
                      eliminarKPI(k.id);
                      toast("KPI eliminado", { description: k.titulo });
                    }}
                    aria-label={`Eliminar KPI ${k.titulo}`}
                    className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground/0 group-hover:text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* Formulario de creación                                                     */
/* -------------------------------------------------------------------------- */

const FRECUENCIAS: ReadonlyArray<{ id: FrecuenciaKPI; label: string }> = [
  { id: "DIARIO", label: "Diario" },
  { id: "SEMANAL", label: "Semanal" },
  { id: "MENSUAL", label: "Mensual" },
];

const FormularioNuevoKPI = ({ onCerrar }: { onCerrar: () => void }) => {
  const crearKPI = useKpisStore((s) => s.crearKPI);
  const [titulo, setTitulo] = useState("");
  const [area, setArea] = useState("Salud");
  const [grupo, setGrupo] = useState("");
  const [objetivo, setObjetivo] = useState<number>(4);
  const [unidad, setUnidad] = useState("veces");
  const [frecuencia, setFrecuencia] = useState<FrecuenciaKPI>("DIARIO");

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || objetivo <= 0) return;
    crearKPI({
      titulo,
      area: area.trim() || "General",
      grupo: grupo.trim() || undefined,
      objetivo,
      unidad: unidad.trim() || "veces",
      frecuencia,
    });
    toast.success("KPI creado", { description: titulo });
    onCerrar();
  };

  return (
    <form onSubmit={enviar} className="surface-card p-4 space-y-3 border-primary/40">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          autoFocus
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título (ej: Frutas)"
          className="h-10 rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-primary/50"
        />
        <input
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Área (Salud, Facultad…)"
          className="h-10 rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-primary/50"
        />
        <input
          type="number"
          min={0.1}
          step="0.1"
          required
          value={objetivo}
          onChange={(e) => setObjetivo(Number(e.target.value))}
          placeholder="Objetivo"
          className="h-10 rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-primary/50"
        />
        <input
          value={unidad}
          onChange={(e) => setUnidad(e.target.value)}
          placeholder="Unidad (frutas, hrs, vasos…)"
          className="h-10 rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-primary/50"
        />
        <select
          value={frecuencia}
          onChange={(e) => setFrecuencia(e.target.value as FrecuenciaKPI)}
          className="h-10 rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-primary/50"
        >
          {FRECUENCIAS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
        <input
          value={grupo}
          onChange={(e) => setGrupo(e.target.value)}
          placeholder="Grupo visual (opcional)"
          className="h-10 rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-primary/50"
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCerrar}
          className="inline-flex items-center gap-1 h-9 px-3 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground"
        >
          <X size={14} /> Cancelar
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-1 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
        >
          <Check size={14} /> Crear
        </button>
      </div>
    </form>
  );
};
