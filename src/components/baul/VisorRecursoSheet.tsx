import { useEffect, useRef, useState } from "react";
import { Paperclip, FileText, FileSpreadsheet, Presentation, Image as ImageIcon, Link2, File } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTareasStore } from "@/stores/tareasStore";
import type { DTO_ArchivoAdjunto, DTO_Tarea } from "@/types/dominio";

const detectarTipo = (nombre: string): DTO_ArchivoAdjunto["tipoIcono"] => {
  const ext = nombre.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext)) return "pdf";
  if (["doc", "docx", "md", "txt"].includes(ext)) return "doc";
  if (["xls", "xlsx", "csv"].includes(ext)) return "sheet";
  if (["ppt", "pptx", "key"].includes(ext)) return "slide";
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) return "img";
  return "otro";
};

const IconoAdjunto = ({ tipo }: { tipo: DTO_ArchivoAdjunto["tipoIcono"] }) => {
  const cls = "size-4 shrink-0 text-muted-foreground";
  switch (tipo) {
    case "pdf":
    case "doc":
      return <FileText className={cls} />;
    case "sheet":
      return <FileSpreadsheet className={cls} />;
    case "slide":
      return <Presentation className={cls} />;
    case "img":
      return <ImageIcon className={cls} />;
    case "link":
      return <Link2 className={cls} />;
    default:
      return <File className={cls} />;
  }
};


interface PropsVisor {
  tarea: DTO_Tarea | null;
  abierto: boolean;
  onCerrar: () => void;
}

/**
 * Visor del Segundo Cerebro. Drawer lateral que muestra título, etiquetas,
 * fecha y notas markdown editables del Proyecto/Recurso seleccionado.
 */
export const VisorRecursoSheet = ({ tarea, abierto, onCerrar }: PropsVisor) => {
  const actualizarNotas = useTareasStore((s) => s.actualizarNotas);
  const adjuntarArchivo = useTareasStore((s) => s.adjuntarArchivo);
  const [notas, setNotas] = useState<string>("");
  const [tagsInput, setTagsInput] = useState<string>("");
  const [guardando, setGuardando] = useState(false);
  const inputArchivoRef = useRef<HTMLInputElement>(null);

  // Lee la versión vigente de la tarea para refrescar `adjuntos` sin reabrir.
  const tareaActual = useTareasStore((s) =>
    tarea ? s.tareas.find((t) => t.id === tarea.id) ?? tarea : null,
  );

  useEffect(() => {
    if (tarea) {
      setNotas(tarea.notasMarkdown ?? "");
      setTagsInput((tarea.etiquetas ?? []).join(" "));
    }
  }, [tarea]);

  if (!tareaActual) return null;

  const etiquetasParseadas = tagsInput
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : `#${t}`));

  const fecha = new Date(tareaActual.fechaCreacion).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const guardar = async () => {
    setGuardando(true);
    await actualizarNotas(tareaActual.id, notas, etiquetasParseadas);
    setGuardando(false);
    toast.success("Notas guardadas", { description: tareaActual.titulo });
    onCerrar();
  };

  const abrirSelectorDrive = () => {
    inputArchivoRef.current?.click();
  };

  const onArchivoSeleccionado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const slug = encodeURIComponent(file.name);
    const urlMockeada = `https://drive.google.com/file/d/mock-${Date.now().toString(36)}/${slug}`;
    await adjuntarArchivo(tareaActual.id, {
      nombre: file.name,
      urlMockeada,
      tipoIcono: detectarTipo(file.name),
    });
    toast.success("📎 Archivo adjuntado desde Drive", { description: file.name });
  };

  return (
    <Sheet open={abierto} onOpenChange={(o) => !o && onCerrar()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto bg-background border-l border-border flex flex-col gap-5"
      >
        <SheetHeader className="text-left space-y-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {tarea.categoria} · {tarea.areaVinculadaId ?? "sin área"} · {fecha}
          </div>
          <SheetTitle className="font-display text-2xl sm:text-3xl leading-tight">
            {tarea.titulo}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Visor del Segundo Cerebro para {tarea.titulo}
          </SheetDescription>
          {etiquetasParseadas.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {etiquetasParseadas.map((t) => (
                <Badge key={t} variant="secondary" className="font-normal">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </SheetHeader>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">
            Etiquetas (separadas por espacio)
          </label>
          <Input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="#AppMascotas #Arquitectura"
          />
        </div>

        <div className="space-y-2 flex-1 flex flex-col min-h-[300px]">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">
            Notas (Markdown)
          </label>
          <Textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="# Título&#10;&#10;Tus ideas, links y pensamientos largos…"
            className="flex-1 font-mono text-sm min-h-[260px]"
          />
        </div>

        <SheetFooter className="gap-2">
          <Button variant="ghost" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar notas"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
