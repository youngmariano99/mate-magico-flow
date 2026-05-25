import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useDistribucionXP, useNivelActividad } from "@/hooks/useInsightsSemanales";

/**
 * Gráfico de torta con la distribución de XP por área PARA + indicador
 * de "días activos" leído del fitnessStore.
 */
export const GraficoBalanceVida = () => {
  const segmentos = useDistribucionXP();
  const { diasActivos, total } = useNivelActividad();

  const totalXp = segmentos.reduce((acc, s) => acc + s.xp, 0);
  const pctActividad = Math.round((diasActivos / total) * 100);

  return (
    <section className="surface-card p-6">
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h3 className="font-display text-lg">Balance de vida</h3>
          <p className="text-xs text-muted-foreground mt-1">
            ¿A qué le dedicaste tu energía? · {totalXp} XP totales
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Nivel de actividad
          </p>
          <p className="font-display text-2xl mt-1">
            <span className="text-primary">{diasActivos}</span>
            <span className="text-muted-foreground text-base"> / {total} días</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{pctActividad}% esta semana</p>
        </div>
      </div>

      {segmentos.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">
          Aún no hay XP registrado. Completá tareas o entrenamientos para ver tu balance.
        </p>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[...segmentos]}
                dataKey="xp"
                nameKey="area"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                stroke="hsl(var(--background))"
              >
                {segmentos.map((s) => (
                  <Cell key={s.area} fill={s.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => [`${value} XP`, name]}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value: string) => (
                  <span className="text-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};
