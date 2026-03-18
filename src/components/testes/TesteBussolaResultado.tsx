import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface Props {
  pontuacoes: Record<string, number>;
  pontuacaoTotal: number;
  respostas?: Record<string, string>;
  createdAt?: string;
}

export default function TesteBussolaResultado({
  pontuacoes,
  pontuacaoTotal,
  respostas,
  createdAt,
}: Props) {
  const chartData = Object.entries(pontuacoes).map(([categoria, pontuacao]) => ({
    categoria,
    pontuacao,
  }));

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const categoriasHtml = Object.entries(pontuacoes)
      .map(
        ([cat, pts]) =>
          `<div style="padding:8px 12px;border-left:3px solid #6366f1;margin-bottom:8px;background:#f8f9fa;border-radius:4px;">
            <strong>${cat}</strong>: ${pts}/4
            ${respostas?.[cat] ? `<br><span style="color:#666;font-size:0.9em">${respostas[cat]}</span>` : ""}
          </div>`
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Bússola da Alta Performance</title>
          <style>
            body { font-family: 'Poppins', system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
            h1 { font-size: 1.5rem; } .badge { display:inline-block;background:#6366f1;color:#fff;padding:4px 12px;border-radius:9999px;font-weight:600; }
          </style>
        </head>
        <body>
          <h1>Bússola da Alta Performance</h1>
          <p><span class="badge">${pontuacaoTotal}/76</span></p>
          ${createdAt ? `<p style="color:#666">Realizado em ${new Date(createdAt).toLocaleDateString("pt-BR")}</p>` : ""}
          <h2>Detalhamento por Categoria</h2>
          ${categoriasHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const { categoria, pontuacao } = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-sm text-foreground">{categoria}</p>
        <p className="text-primary font-bold">{pontuacao}/4</p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Bússola da Alta Performance</CardTitle>
            <Badge variant="secondary" className="text-sm font-bold">
              {pontuacaoTotal}/76
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
        </div>
        {createdAt && (
          <p className="text-xs text-muted-foreground">
            Realizado em {new Date(createdAt).toLocaleDateString("pt-BR")}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Radar Chart */}
        <div className="bg-muted/50 rounded-lg p-4">
          <ResponsiveContainer width="100%" height={450}>
            <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid
                gridType="polygon"
                stroke="hsl(var(--border))"
                strokeOpacity={0.6}
              />
              <PolarAngleAxis
                dataKey="categoria"
                tick={{
                  fill: "hsl(var(--foreground))",
                  fontSize: 10,
                }}
                tickLine={false}
              />
              <PolarRadiusAxis
                domain={[0, 4]}
                tickCount={5}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
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

        {/* Detalhamento por categoria */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">
            Detalhamento por Categoria
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(pontuacoes).map(([cat, pts]) => (
              <div
                key={cat}
                className="bg-muted rounded-lg p-3 border-l-[3px] border-l-primary"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-foreground">{cat}</span>
                  <Badge variant="outline" className="text-xs">
                    {pts}/4
                  </Badge>
                </div>
                {respostas?.[cat] && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {respostas[cat]}
                  </p>
                )}
                {/* Mini progress bar */}
                <div className="mt-2 h-1.5 w-full rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(pts / 4) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
