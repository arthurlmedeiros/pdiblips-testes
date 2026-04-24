import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BANDA_COLORS, diasAteReteste, isScoreDesatualizado } from "@/utils/scoreCalculation";
import type { ScoreConsolidado } from "@/hooks/useScoreConsolidado";

interface Props {
  score: ScoreConsolidado;
}

export default function ScoreCard({ score }: Props) {
  const colors = BANDA_COLORS[score.banda];
  const desatualizado = isScoreDesatualizado(score.created_at);
  const dias = diasAteReteste(score.created_at);

  return (
    <Card className={`border-2 ${colors.border} print:shadow-none`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Score Consolidado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-4">
          <span className="text-7xl font-bold tabular-nums leading-none">
            {score.score_display}
          </span>
          <div className="mb-1 space-y-1">
            <Badge className={`${colors.bg} ${colors.text} border ${colors.border} text-sm`}>
              {score.banda}
            </Badge>
            <p className="text-xs text-muted-foreground">
              Raw: {score.score_raw.toFixed(1)} · Display: {score.score_display}/100
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {score.cargo_alvo} · {score.nivel_cargo}
        </p>

        {desatualizado ? (
          <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Testes desatualizados — refaça os 5 testes (política semestral).
          </div>
        ) : dias <= 30 ? (
          <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
            <Clock className="h-4 w-4 shrink-0" />
            Reteste recomendado em {dias} dias.
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Próximo reteste em {dias} dias.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
