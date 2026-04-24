import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScoreConsolidado } from "@/hooks/useScoreConsolidado";

interface Props {
  scores: ScoreConsolidado[];
}

export default function ScoreEvolutionChart({ scores }: Props) {
  const data = [...scores]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((s) => ({
      data: format(new Date(s.created_at), "MMM/yy", { locale: ptBR }),
      score: s.score_display,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evolução do Score</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length < 2 ? (
          <p className="text-sm text-muted-foreground">
            Calcule o score em pelo menos dois momentos (reteste semestral) para visualizar a evolução.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="data" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => [`${v}`, "Score"]}
              />
              <ReferenceLine y={39} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "P50°", fontSize: 10, fill: "#f59e0b" }} />
              <ReferenceLine y={75} stroke="#10b981" strokeDasharray="4 4" label={{ value: "P75°", fontSize: 10, fill: "#10b981" }} />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
