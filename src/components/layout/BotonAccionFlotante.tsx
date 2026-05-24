import { useState } from "react";
import { Plus, ClipboardList, Repeat2, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/auth/AuthProvider";
import { useTareasStore } from "@/stores/tareasStore";
import { useHabitosStore } from "@/stores/habitosStore";
import type { CategoriaPARA, DTO_Tarea, DTO_Habito, DTO_Proyecto } from "@/types/dominio";

type TipoEntidad = "tarea" | "habito" | "proyecto";

const AREAS = [
  "Desarrollo Profesional",
  "Facultad",
  "Salud",
  "Finanzas",
  "Idiomas",
  "MateFlow",
  "Personal",
] as const;

const CATEGORIAS_PARA: ReadonlyArray<CategoriaPARA> = ["Proyecto", "Area", "Recurso", "Archivo"];

/**
 * Floating Action Button global — CRUD manual de respaldo (no pasa por IA).
 * Abre un menú rápido y luego un Sheet con un formulario estructurado mínimo
 * (sólo campos esenciales) que escribe directo en los stores Zustand.
 *
 * Sólo visible para usuarios autenticados (la sesión vive en AuthProvider).
 */
export const BotonAccionFlotante = () => {
  const { usuario } = useAuth();
  const [tipoAbierto, setTipoAbierto] = useState<TipoEntidad | null>(null);

  if (!usuario) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Crear manualmente"
            className="fixed z-40 bottom-[156px] md:bottom-28 right-5 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40 grid place-items-center hover:scale-105 active:scale-95 transition-transform mate-glow"
          >
            <Plus size={26} strokeWidth={2.4} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-52 mb-2">
          <DropdownMenuItem onSelect={() => setTipoAbierto("tarea")}>
            <ClipboardList size={16} className="mr-2" /> Nueva Tarea
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setTipoAbierto("habito")}>
            <Repeat2 size={16} className="mr-2" /> Nuevo Hábito
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setTipoAbierto("proyecto")}>
            <FolderKanban size={16} className="mr-2" /> Nuevo Proyecto
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet open={tipoAbierto !== null} onOpenChange={(o) => !o && setTipoAbierto(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {tipoAbierto === "tarea" && (
            <FormularioTarea onListo={() => setTipoAbierto(null)} />
          )}
          {tipoAbierto === "habito" && (
            <FormularioHabito onListo={() => setTipoAbierto(null)} />
          )}
          {tipoAbierto === "proyecto" && (
            <FormularioProyecto onListo={() => setTipoAbierto(null)} />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* Formularios — UI mínima, tipada y desacoplada del Procesador Mágico.       */
/* -------------------------------------------------------------------------- */

const inputCls =
  "w-full h-10 rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-primary/50 transition-colors";
const labelCls = "text-xs font-medium uppercase tracking-wide text-muted-foreground";

interface PropsForm {
  onListo: () => void;
}

const FormularioTarea = ({ onListo }: PropsForm) => {
  const agregar = useTareasStore((s) => s.agregar);
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState<CategoriaPARA>("Area");
  const [fecha, setFecha] = useState("");
  const [xp, setXp] = useState(10);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = titulo.trim();
    if (!t) return;
    const nueva: DTO_Tarea = await agregar({
      titulo: t,
      categoria,
      puntosExperiencia: xp,
      fechaProgramada: fecha || undefined,
    });
    toast.success("✅ Tarea creada", { description: nueva.titulo });
    onListo();
  };

  return (
    <form onSubmit={enviar} className="space-y-5 pt-2">
      <SheetHeader>
        <SheetTitle>Nueva tarea</SheetTitle>
        <SheetDescription>Captura estructurada sin pasar por la IA.</SheetDescription>
      </SheetHeader>
      <div className="space-y-2">
        <label className={labelCls}>Título</label>
        <input
          autoFocus
          required
          maxLength={140}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className={inputCls}
          placeholder="Ej: Revisar PR de checkout"
        />
      </div>
      <div className="space-y-2">
        <label className={labelCls}>Categoría PARA</label>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as CategoriaPARA)}
          className={inputCls}
        >
          {CATEGORIAS_PARA.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className={labelCls}>Fecha (opcional)</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="space-y-2">
          <label className={labelCls}>XP</label>
          <input
            type="number"
            min={0}
            max={100}
            value={xp}
            onChange={(e) => setXp(Number(e.target.value) || 0)}
            className={inputCls}
          />
        </div>
      </div>
      <BotonGuardar />
    </form>
  );
};

const FormularioHabito = ({ onListo }: PropsForm) => {
  const agregar = useHabitosStore((s) => s.agregar);
  const [titulo, setTitulo] = useState("");
  const [area, setArea] = useState<string>(AREAS[2]);
  const [xp, setXp] = useState(8);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const t = titulo.trim();
    if (!t) return;
    const nuevo: DTO_Habito = agregar({ titulo: t, area, xpPorCompletar: xp });
    toast.success("🔁 Hábito creado", { description: `${nuevo.titulo} · ${area}` });
    onListo();
  };

  return (
    <form onSubmit={enviar} className="space-y-5 pt-2">
      <SheetHeader>
        <SheetTitle>Nuevo hábito</SheetTitle>
        <SheetDescription>Se repite a diario y suma racha.</SheetDescription>
      </SheetHeader>
      <div className="space-y-2">
        <label className={labelCls}>Título</label>
        <input
          autoFocus
          required
          maxLength={80}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className={inputCls}
          placeholder="Ej: Meditar 10 min"
        />
      </div>
      <div className="space-y-2">
        <label className={labelCls}>Área</label>
        <select value={area} onChange={(e) => setArea(e.target.value)} className={inputCls}>
          {AREAS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className={labelCls}>XP por completar</label>
        <input
          type="number"
          min={1}
          max={50}
          value={xp}
          onChange={(e) => setXp(Number(e.target.value) || 1)}
          className={inputCls}
        />
      </div>
      <BotonGuardar />
    </form>
  );
};

const FormularioProyecto = ({ onListo }: PropsForm) => {
  const agregar = useTareasStore((s) => s.agregar);
  const [titulo, setTitulo] = useState("");
  const [area, setArea] = useState<string>(AREAS[0]);
  const [descripcion, setDescripcion] = useState("");
  const [fechaObjetivo, setFechaObjetivo] = useState("");

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = titulo.trim();
    if (!t) return;
    // Proyecto se persiste como tarea PARA "Proyecto" con notas markdown.
    const proyecto: DTO_Proyecto = {
      id: `p-${Math.random().toString(36).slice(2, 9)}`,
      titulo: t,
      area,
      descripcion: descripcion.trim() || undefined,
      fechaObjetivo: fechaObjetivo || undefined,
      fechaCreacion: new Date().toISOString(),
    };
    await agregar({
      titulo: proyecto.titulo,
      categoria: "Proyecto",
      areaVinculadaId: proyecto.area,
      puntosExperiencia: 50,
      fechaProgramada: proyecto.fechaObjetivo,
      etiquetas: [proyecto.area],
      notasMarkdown: proyecto.descripcion
        ? `# ${proyecto.titulo}\n\n${proyecto.descripcion}`
        : undefined,
    });
    toast.success("📁 Proyecto creado", { description: proyecto.titulo });
    onListo();
  };

  return (
    <form onSubmit={enviar} className="space-y-5 pt-2">
      <SheetHeader>
        <SheetTitle>Nuevo proyecto</SheetTitle>
        <SheetDescription>Un objetivo con varias tareas asociadas.</SheetDescription>
      </SheetHeader>
      <div className="space-y-2">
        <label className={labelCls}>Título</label>
        <input
          autoFocus
          required
          maxLength={140}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className={inputCls}
          placeholder="Ej: Lanzar MateFlow v1"
        />
      </div>
      <div className="space-y-2">
        <label className={labelCls}>Área</label>
        <select value={area} onChange={(e) => setArea(e.target.value)} className={inputCls}>
          {AREAS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className={labelCls}>Descripción (opcional)</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
          maxLength={500}
          className={`${inputCls} h-auto py-2 resize-none`}
          placeholder="Objetivo, alcance, criterios de éxito…"
        />
      </div>
      <div className="space-y-2">
        <label className={labelCls}>Fecha objetivo (opcional)</label>
        <input
          type="date"
          value={fechaObjetivo}
          onChange={(e) => setFechaObjetivo(e.target.value)}
          className={inputCls}
        />
      </div>
      <BotonGuardar />
    </form>
  );
};

const BotonGuardar = () => (
  <button
    type="submit"
    className="w-full h-11 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
  >
    Guardar
  </button>
);
