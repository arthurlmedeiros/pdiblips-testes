import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Bird, Fish, Cat, Dog } from "lucide-react";

const ANIMAL_MAP: Record<
  string,
  {
    animal: string;
    label: string;
    emoji: string;
    icon: typeof Bird;
    color: string;
    caracteristicas: string;
    tracos: string;
    pontosFortes: string;
    pontosMelhoria: string;
    motivacoes: string;
    valores: string;
  }
> = {
  idealista: {
    animal: "Águia",
    label: "Águia (Idealista)",
    emoji: "🦅",
    icon: Bird,
    color: "hsl(var(--chart-1))",
    caracteristicas: "Visionária, criativa, busca inovação e liberdade.",
    tracos: "Explora novas ideias, valoriza autonomia e pensa no futuro.",
    pontosFortes: "Visão estratégica e criatividade.",
    pontosMelhoria: "Pode ignorar detalhes e parecer distante.",
    motivacoes: "Liberdade, inovação e crescimento pessoal.",
    valores: "Autenticidade e visão de futuro.",
  },
  focado: {
    animal: "Tubarão",
    label: "Tubarão (Focado)",
    emoji: "🦈",
    icon: Fish,
    color: "hsl(var(--chart-2))",
    caracteristicas: "Competitiva, focada em resultados, direta e decidida.",
    tracos: "Assume controle, busca vencer e enfrenta desafios de frente.",
    pontosFortes: "Foco em metas e liderança.",
    pontosMelhoria: "Tende a ser autoritário e impaciente.",
    motivacoes: "Superação, reconhecimento e vitória.",
    valores: "Eficiência e conquista.",
  },
  afetivo: {
    animal: "Gato",
    label: "Gato (Afetivo)",
    emoji: "🐱",
    icon: Cat,
    color: "hsl(var(--chart-3))",
    caracteristicas: "Afetivo, sensível, comunicativo e voltado a pessoas.",
    tracos: "Cria laços, evita conflitos e gosta de ambientes harmoniosos.",
    pontosFortes: "Empatia e habilidade de engajamento.",
    pontosMelhoria: "Pode se esquivar de decisões difíceis.",
    motivacoes: "Relações afetivas, aprovação e bem-estar coletivo.",
    valores: "Harmonia e empatia.",
  },
  organizado: {
    animal: "Lobo",
    label: "Lobo (Organizado)",
    emoji: "🐺",
    icon: Dog,
    color: "hsl(var(--chart-4))",
    caracteristicas: "Organizado, leal, confiável e metódico.",
    tracos: "Segue regras, preza pela segurança e cumpre rotinas.",
    pontosFortes: "Confiabilidade e precisão.",
    pontosMelhoria: "Resiste a mudanças e é avesso ao risco.",
    motivacoes: "Ordem, estabilidade e previsibilidade.",
    valores: "Lealdade e responsabilidade.",
  },
};

export const PERFIL_ANIMAL_NAME: Record<string, string> = {
  idealista: "Águia",
  focado: "Tubarão",
  afetivo: "Gato",
  organizado: "Lobo",
};

interface Props {
  resultado: Record<string, number>;
  perfilDominante: string;
  createdAt?: string;
}

export default function TestePerfilResultado({
  resultado,
  perfilDominante,
  createdAt,
}: Props) {
  const dominanteInfo = ANIMAL_MAP[perfilDominante];

  const chartData = Object.entries(resultado).map(([key, value]) => ({
    perfil: ANIMAL_MAP[key]?.animal || key,
    pontuacao: Math.round((value / 25) * 100),
    fullMark: 100,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const { perfil, pontuacao } = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-sm text-foreground">{perfil}</p>
        <p className="text-primary font-bold">{pontuacao}%</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Card principal com radar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg">Resultado do Perfil Comportamental</CardTitle>
            <Badge variant="default" className="text-sm">
              {dominanteInfo?.emoji} {dominanteInfo?.label || perfilDominante}
            </Badge>
          </div>
          {createdAt && (
            <p className="text-xs text-muted-foreground">
              Realizado em {new Date(createdAt).toLocaleDateString("pt-BR")}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {/* Radar Chart */}
          <div className="bg-muted/50 rounded-lg p-4">
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid
                  gridType="polygon"
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.6}
                />
                <PolarAngleAxis
                  dataKey="perfil"
                  tick={{
                    fill: "hsl(var(--foreground))",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                  tickLine={false}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tickCount={5}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `${v}%`}
                  axisLine={false}
                />
                <Radar
                  name="Pontuação"
                  dataKey="pontuacao"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  dot={{
                    r: 5,
                    fill: "hsl(var(--primary))",
                    stroke: "hsl(var(--primary-foreground))",
                    strokeWidth: 2,
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribuição em barras visuais */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(resultado).map(([key, value]) => {
              const info = ANIMAL_MAP[key];
              if (!info) return null;
              const pct = (value / 25) * 100;
              const isDominante = key === perfilDominante;
              return (
                <div
                  key={key}
                  className={`rounded-lg p-3 text-center transition-all ${
                    isDominante
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-muted border border-border"
                  }`}
                >
                  <span className="text-2xl">{info.emoji}</span>
                  <p className="text-xs font-semibold mt-1 text-foreground">{info.animal}</p>
                  <p className="text-lg font-bold text-primary">{Math.round(pct)}%</p>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-background">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cards detalhados dos perfis */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Informações sobre os Perfis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(ANIMAL_MAP).map(([key, info]) => {
            const isDominante = key === perfilDominante;
            const Icon = info.icon;
            return (
              <Card
                key={key}
                className={`relative overflow-hidden transition-all ${
                  isDominante ? "border-2 border-primary shadow-md" : ""
                }`}
              >
                {isDominante && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="default" className="text-xs">
                      ⭐ Seu perfil dominante
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center w-12 h-12 rounded-full"
                      style={{ backgroundColor: `${info.color}20` }}
                    >
                      <span className="text-2xl">{info.emoji}</span>
                    </div>
                    <div>
                      <CardTitle className="text-base">{info.label}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <InfoRow label="Características" value={info.caracteristicas} />
                  <InfoRow label="Traços" value={info.tracos} />
                  <InfoRow label="Pontos Fortes" value={info.pontosFortes} />
                  <InfoRow label="Pontos de Melhoria" value={info.pontosMelhoria} />
                  <InfoRow label="Motivações" value={info.motivacoes} />
                  <InfoRow label="Valores" value={info.valores} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-semibold text-foreground">{label}:</span>{" "}
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
}
