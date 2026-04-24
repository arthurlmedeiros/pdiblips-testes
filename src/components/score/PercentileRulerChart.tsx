import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BANDA_COLORS } from "@/utils/scoreCalculation";
import type { ScoreConsolidado } from "@/hooks/useScoreConsolidado";

interface Props {
  latestScores: ScoreConsolidado[];
  titulo?: string;
}

export default function PercentileRulerChart({ latestScores, titulo = "Distribuição Percentil" }: Props) {
  const total = latestScores.length;
  const bandas = ["Percentil 25°", "Percentil 50°", "Percentil 75°"] as const;
  const counts = {
    "Percentil 25°": latestScores.filter((s) => s.banda === "Percentil 25°").length,
    "Percentil 50°": latestScores.filter((s) => s.banda === "Percentil 50°").length,
    "Percentil 75°": latestScores.filter((s) => s.banda === "Percentil 75°").length,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {total > 0 ? (
          <>
            <div className="flex h-8 overflow-hidden rounded-full">
              {bandas.map((b) => {
                const pct = (counts[b] / total) * 100;
                return pct > 0 ? (
                  <div
                    key={b}
                    style={{ width: `${pct}%`, background: BANDA_COLORS[b].hex }}
                    className="flex items-center justify-center text-xs font-bold text-white"
                    title={`${b}: ${counts[b]}`}
                  >
                    {pct >= 10 ? counts[b] : ""}
                  </div>
                ) : null;
              })}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {bandas.map((b) => {
                const c = BANDA_COLORS[b];
                const pct = Math.round((counts[b] / total) * 100);
                return (
                  <div key={b} className={`rounded-lg border p-3 ${c.bg} ${c.border}`}>
                    <p className={`text-xs font-semibold ${c.text}`}>{b}</p>
                    <p className="mt-1 text-2xl font-bold">{counts[b]}</p>
                    <p className="text-xs text-muted-foreground">{pct}% dos profissionais</p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {total} profissional{total !== 1 ? "is" : ""} · sem nomes exibidos
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Ainda não há scores calculados para exibir a distribuição.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
