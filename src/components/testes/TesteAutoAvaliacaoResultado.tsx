import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { TesteAutoAvaliacao } from "@/hooks/useTestesAutoAvaliacao";

const DIMENSAO_LABELS: Record<string, string> = {
  fluencia_ingles: "Inglês",
  uso_tecnologia: "Tecnologia",
  comunicacao_clara: "Comunicação",
  gestao_conflitos: "Conflitos",
  decisao_pressao: "Decisão",
  organizacao_disciplina: "Organização",
  responsabilidade_ownership: "Ownership",
};

function getNivel(total: number): { label: string; variant: "default" | "secondary" | "outline" | "destructive"; color: string } {
  if (total <= 10) return { label: "Iniciante", variant: "secondary", color: "#94a3b8" };
  if (total <= 20) return { label: "Em Desenvolvimento", variant: "outline", color: "#f59e0b" };
  if (total <= 28) return { label: "Sênior", variant: "default", color: "#3b82f6" };
  return { label: "Referência", variant: "default", color: "#10b981" };
}

function getBarColor(value: number): string {
  if (value <= 1) return "#94a3b8";
  if (value <= 2) return "#f59e0b";
  if (value <= 3) return "#3b82f6";
  if (value <= 4) return "#8b5cf6";
  return "#10b981";
}

interface Props {
  teste: TesteAutoAvaliacao;
}

export default function TesteAutoAvaliacaoResultado({ teste }: Props) {
  const nivel = getNivel(teste.pontuacao_total);
  const media = (teste.pontuacao_total / 7).toFixed(1);

  const chartData = Object.entries(teste.pontuacoes).map(([key, value]) => ({
    name: DIMENSAO_LABELS[key] ?? key,
    valor: value,
  }));

  return (
    <div className="space-y-6">
      {/* Header com pontuação */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-base">Resultado da Auto Avaliação</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(teste.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit", month: "long", year: "numeric"
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{teste.pontuacao_total}<span className="text-muted-foreground text-lg font-normal">/35</span></div>
              <div className="text-sm text-muted-foreground">Média: {media}/5</div>
              <Badge
                variant={nivel.variant}
                className="mt-1"
                style={nivel.variant === "default" ? { backgroundColor: nivel.color } : undefined}
              >
                {nivel.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Gráfico de barras */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Competências por Dimensão</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(v: number) => [v, "Pontuação"]}
                contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
              />
              <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={getBarColor(entry.valor)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Dados profissionais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados Profissionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Formação</span>
              <p className="font-medium mt-0.5 whitespace-pre-wrap">{teste.dados_pessoais.formacao}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Especialização</span>
              <p className="font-medium mt-0.5">{teste.dados_pessoais.especializacao}</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Idade</span>
              <p className="font-medium mt-0.5">{teste.dados_pessoais.idade} anos</p>
            </div>
            <div>
              <span className="text-muted-foreground">Exp. no cargo</span>
              <p className="font-medium mt-0.5">{teste.dados_pessoais.experiencia_cargo} {teste.dados_pessoais.experiencia_cargo === 1 ? "ano" : "anos"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Residência</span>
              <p className="font-medium mt-0.5">{teste.dados_pessoais.residencia}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
