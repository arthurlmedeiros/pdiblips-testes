import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Printer } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface PilarResultado {
  pilar: string;
  analise_geral: string;
  pontuacao: {
    clareza: number;
    profundidade: number;
    acao: number;
    visao: number;
  };
  score_final_pergunta: number;
}

interface Props {
  pontuacoesFechadas: Record<string, number>;
  pontuacoesAbertas: PilarResultado[];
  scoreTotal: number;
  percentil: number;
  laudoIA: string;
  nivel: string;
  createdAt?: string;
}

const PILARES_NOMES = [
  "Propriedade",
  "Execução Consistente",
  "Impacto e Influência",
  "Autodesenvolvimento",
  "Competências Globais",
];

const PILAR_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--primary) / 0.85)",
  "hsl(var(--primary) / 0.7)",
  "hsl(var(--primary) / 0.55)",
  "hsl(var(--primary) / 0.4)",
];

export default function TestePercentilResultado({
  pontuacoesFechadas,
  pontuacoesAbertas,
  scoreTotal,
  percentil,
  laudoIA,
  nivel,
  createdAt,
}: Props) {
  // Build chart data
  const chartData = PILARES_NOMES.map((pilar, i) => {
    const fechada = pontuacoesFechadas[pilar] || 0;
    const abertaResult = pontuacoesAbertas?.find((r) => r.pilar === pilar);
    const aberta = abertaResult?.score_final_pergunta || 0;
    return {
      pilar: pilar.length > 15 ? pilar.substring(0, 13) + "…" : pilar,
      pilarFull: pilar,
      fechada,
      aberta,
      total: fechada + aberta,
      index: i,
    };
  });

  const handlePrint = () => window.print();

  const percentilBadgeVariant = percentil >= 70 ? "default" : percentil >= 40 ? "secondary" : "destructive";

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-sm text-foreground">{d.pilarFull}</p>
        <p className="text-xs text-muted-foreground">Fechadas: {d.fechada}/10</p>
        <p className="text-xs text-muted-foreground">Aberta: {d.aberta}/5</p>
        <p className="text-primary font-bold">Total: {d.total}/15</p>
      </div>
    );
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <CardTitle className="text-lg">Maturidade Executiva</CardTitle>
              <Badge variant={percentilBadgeVariant} className="text-sm font-bold">
                Percentil: {percentil}%
              </Badge>
              <Badge variant="outline" className="capitalize">
                {nivel}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden">
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
          </div>
          {createdAt && (
            <p className="text-xs text-muted-foreground">
              Realizado em {new Date(createdAt).toLocaleDateString("pt-BR")}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold text-foreground">{scoreTotal}</span>
            <span className="text-xl text-muted-foreground">/75</span>
          </div>
          <Progress value={(scoreTotal / 75) * 100} className="h-3 mt-3" />
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pontuação por Pilar</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" domain={[0, 15]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis dataKey="pilar" type="category" width={130} tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={PILAR_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detalhamento por Pilar */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Detalhamento por Pilar</h3>
        {PILARES_NOMES.map((pilar) => {
          const fechada = pontuacoesFechadas[pilar] || 0;
          const abertaResult = pontuacoesAbertas?.find((r) => r.pilar === pilar);
          const aberta = abertaResult?.score_final_pergunta || 0;
          const total = fechada + aberta;

          return (
            <Card key={pilar}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base">{pilar}</CardTitle>
                  <Badge variant="outline" className="font-bold">{total}/15</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-muted-foreground text-xs mb-1">Perguntas Fechadas</p>
                    <p className="font-bold text-foreground">{fechada}/10</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-muted-foreground text-xs mb-1">Pergunta Aberta (IA)</p>
                    <p className="font-bold text-foreground">{aberta}/5</p>
                  </div>
                </div>

                {abertaResult && (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(abertaResult.pontuacao || {}).map(([dim, val]) => (
                        <Badge key={dim} variant="secondary" className="text-xs capitalize">
                          {dim}: {val as number}/5
                        </Badge>
                      ))}
                    </div>
                    {abertaResult.analise_geral && (
                      <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground leading-relaxed">
                        {abertaResult.analise_geral}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Laudo Consolidado */}
      {laudoIA && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Laudo Consolidado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
              {laudoIA}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
