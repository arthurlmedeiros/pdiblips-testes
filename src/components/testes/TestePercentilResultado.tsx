import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Printer,
  FileText,
  Target,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  Award,
  TrendingUp,
} from "lucide-react";

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

// ── Percentile bands ──
const PERCENTILE_BANDS = [
  { label: "25°", min: 0, max: 50, color: "hsl(var(--destructive))" },
  { label: "50°", min: 50, max: 75, color: "hsl(var(--accent-foreground) / 0.6)" },
  { label: "75°", min: 75, max: 95, color: "hsl(var(--primary) / 0.7)" },
  { label: "95°", min: 95, max: 100, color: "hsl(var(--primary))" },
];

function getBandForPercentil(p: number) {
  if (p < 50) return PERCENTILE_BANDS[0];
  if (p < 75) return PERCENTILE_BANDS[1];
  if (p < 95) return PERCENTILE_BANDS[2];
  return PERCENTILE_BANDS[3];
}

function getBandName(p: number) {
  if (p < 50) return "Percentil 25°";
  if (p < 75) return "Percentil 50°";
  if (p < 95) return "Percentil 75°";
  return "Percentil 95°";
}

// ── Sanitização anti-agent-talk ──
const AGENT_TALK_PATTERNS = [
  /^(Se você quiser|Posso também|Fico à disposição|Caso precise|Caso queira|Se preferir|Se desejar|Estou à disposição).*/i,
  /\b(posso converter|posso sugerir|posso elaborar|posso montar|posso preparar|posso detalhar)\b/i,
  /\b(scorecard|roteiro de entrevista final|checagem de referências)\b.*$/i,
];

function sanitizeLaudo(md: string): string {
  const lines = md.split("\n");
  const cleaned: string[] = [];
  let foundRecomendacoes = false;

  for (const line of lines) {
    if (/^#{2,3}\s+Recomendações/i.test(line)) foundRecomendacoes = true;

    if (foundRecomendacoes && !line.startsWith("#")) {
      const isAgentTalk = AGENT_TALK_PATTERNS.some((p) => p.test(line.trim()));
      if (isAgentTalk) continue;
    }

    const trimmed = line.trim();
    if (trimmed && AGENT_TALK_PATTERNS.some((p) => p.test(trimmed))) continue;

    cleaned.push(line);
  }

  return cleaned.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ── Markdown section parsing ──
interface Section {
  title: string;
  content: string;
}

const SECTION_KEYWORDS = [
  { key: "visão geral", title: "Visão Geral" },
  { key: "pontos fortes", title: "Pontos Fortes" },
  { key: "áreas de desenvolvimento", title: "Áreas de Desenvolvimento" },
  { key: "recomendações", title: "Recomendações" },
];

function parseSections(md: string): Section[] {
  const lines = md.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const headerMatch = line.match(/^#{2,3}\s+(.+)/);
    if (headerMatch) {
      if (current) sections.push(current);
      current = { title: headerMatch[1].trim(), content: "" };
    } else if (current) {
      current.content += line + "\n";
    }
  }
  if (current) sections.push(current);

  if (sections.length === 0) {
    current = null;
    for (const line of lines) {
      const boldMatch = line.match(/^\*\*([^*]+?)(?::)?\*\*/);
      if (boldMatch) {
        if (current) sections.push(current);
        const rest = line.replace(/^\*\*[^*]+?\*\*:?\s*/, "");
        current = { title: boldMatch[1].trim(), content: rest ? rest + "\n" : "" };
      } else if (current) {
        current.content += line + "\n";
      }
    }
    if (current) sections.push(current);
  }

  if (sections.length === 0) {
    const fullText = md;
    for (let i = 0; i < SECTION_KEYWORDS.length; i++) {
      const kw = SECTION_KEYWORDS[i];
      const regex = new RegExp(kw.key, "i");
      const idx = fullText.search(regex);
      if (idx === -1) continue;

      const nextIdx = SECTION_KEYWORDS.slice(i + 1).reduce((min, nk) => {
        const nIdx = fullText.search(new RegExp(nk.key, "i"));
        return nIdx !== -1 && nIdx < min ? nIdx : min;
      }, fullText.length);

      const content = fullText.slice(idx + kw.key.length, nextIdx).replace(/^[:\s]+/, "");
      if (content.trim()) {
        sections.push({ title: kw.title, content: content.trim() });
      }
    }
  }

  console.log("laudo sections:", sections.length, sections.map(s => s.title));
  return sections;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  "visão geral": <FileText className="h-5 w-5 text-primary" />,
  "pontos fortes": <ThumbsUp className="h-5 w-5 text-emerald-500" />,
  "áreas de desenvolvimento": <AlertTriangle className="h-5 w-5 text-amber-500" />,
  "recomendações": <Lightbulb className="h-5 w-5 text-primary" />,
};

const SECTION_COLORS: Record<string, string> = {
  "visão geral": "border-l-primary",
  "pontos fortes": "border-l-emerald-500",
  "áreas de desenvolvimento": "border-l-amber-500",
  "recomendações": "border-l-primary",
};

function getIcon(title: string) {
  const key = title.toLowerCase().trim();
  for (const [k, icon] of Object.entries(SECTION_ICONS)) {
    if (key.includes(k)) return icon;
  }
  return <FileText className="h-5 w-5 text-primary" />;
}

function getBorderColor(title: string) {
  const key = title.toLowerCase().trim();
  for (const [k, color] of Object.entries(SECTION_COLORS)) {
    if (key.includes(k)) return color;
  }
  return "border-l-primary";
}

function NivelBadge({ text }: { text: string }) {
  const lower = text.toLowerCase();
  if (lower.includes("alto"))
    return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-300 hover:bg-emerald-500/25">Alto</Badge>;
  if (lower.includes("médio") || lower.includes("medio"))
    return <Badge className="bg-amber-500/15 text-amber-700 border-amber-300 hover:bg-amber-500/25">Médio</Badge>;
  if (lower.includes("baixo"))
    return <Badge className="bg-red-500/15 text-red-700 border-red-300 hover:bg-red-500/25">Baixo</Badge>;
  return null;
}

// ── Bullet parser ──
function parseBullets(markdown: string): string[] {
  return markdown
    .split("\n")
    .filter((l) => /^[-*•]\s+/.test(l.trim()) || /^\d+\.\s+/.test(l.trim()))
    .map((l) => l.replace(/^[-*•\d.]+\s+/, "").trim())
    .filter(Boolean);
}

// ── Sub-components ──

function PercentileRuler({ percentil }: { percentil: number }) {
  const activeBand = getBandForPercentil(percentil);

  return (
    <div className="space-y-4">
      {/* Rótulos superiores */}
      <div className="flex text-xs font-semibold text-muted-foreground">
        {PERCENTILE_BANDS.map((band) => {
          const isActive = band.label === activeBand.label;
          return (
            <div key={band.label} className="flex-1 text-center">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold transition-all ${
                  isActive ? "text-white" : "text-muted-foreground"
                }`}
                style={isActive ? { backgroundColor: band.color } : {}}
              >
                {band.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Barra de zonas */}
      <div className="relative">
        <div className="flex h-8 rounded-full overflow-hidden border border-border/50 shadow-inner">
          {PERCENTILE_BANDS.map((band) => {
            const isActive = band.label === activeBand.label;
            return (
              <div
                key={band.label}
                className="relative flex-1 flex items-center justify-center transition-all"
                style={{
                  backgroundColor: band.color,
                  opacity: isActive ? 1 : 0.25,
                }}
              />
            );
          })}
        </div>

        {/* Marcador de posição */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 pointer-events-none"
          style={{ left: `${percentil}%` }}
        >
          <div
            className="w-5 h-5 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: activeBand.color, fontSize: "8px" }}
          >
            ▲
          </div>
        </div>
      </div>

      {/* Escala numérica */}
      <div className="flex text-xs text-muted-foreground">
        {PERCENTILE_BANDS.map((band) => (
          <div key={band.label} className="flex-1 flex justify-between px-0.5">
            <span>{band.min}%</span>
          </div>
        ))}
        <span className="text-xs text-muted-foreground">100%</span>
      </div>

      {/* Posição atual */}
      <p className="text-center text-sm font-medium" style={{ color: activeBand.color }}>
        Você está no <strong>{activeBand.label}</strong> percentil · Pontuação: {percentil}%
      </p>
    </div>
  );
}

function SectionCard({ section }: { section: Section }) {
  const key = section.title.toLowerCase().trim();
  const isGeral = key.includes("visão geral");
  const isFortes = key.includes("pontos fortes");
  const isDesenv = key.includes("áreas de desenvolvimento") || key.includes("areas de desenvolvimento");
  const isRec = key.includes("recomendações") || key.includes("recomendacoes");

  const bullets = parseBullets(section.content);

  if (isGeral) {
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {getIcon(section.title)}
            {section.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content.trim()}</ReactMarkdown>
        </CardContent>
      </Card>
    );
  }

  if (isFortes && bullets.length > 0) {
    return (
      <Card className="border-l-4 border-l-emerald-500 bg-emerald-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {getIcon(section.title)}
            {section.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-emerald-500 font-bold mt-0.5 shrink-0">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  }

  if (isDesenv && bullets.length > 0) {
    return (
      <Card className="border-l-4 border-l-amber-500 bg-amber-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {getIcon(section.title)}
            {section.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-amber-500 font-bold mt-0.5 shrink-0">↑</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  }

  if (isRec && bullets.length > 0) {
    return (
      <Card className="border-l-4 border-l-primary bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {getIcon(section.title)}
            {section.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-primary font-bold mt-0.5 shrink-0 min-w-[1.25rem]">{i + 1}.</span>
                <span>{b}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    );
  }

  // Fallback: default styled card
  const borderColor = getBorderColor(section.title);
  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardHeader className="pb-3 bg-muted/30 rounded-t-lg">
        <CardTitle className="text-base flex items-center gap-2">
          {getIcon(section.title)}
          {section.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm max-w-none dark:prose-invert pt-4">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            table: ({ children }) => (
              <div className="rounded-md border my-3">
                <Table>{children}</Table>
              </div>
            ),
            thead: ({ children }) => <TableHeader>{children}</TableHeader>,
            tbody: ({ children }) => <TableBody>{children}</TableBody>,
            tr: ({ children }) => <TableRow>{children}</TableRow>,
            th: ({ children }) => (
              <TableHead className="font-semibold">{children}</TableHead>
            ),
            td: ({ children }) => {
              const text = String(children ?? "");
              const isLevel = /\b(alto|médio|medio|baixo)\b/i.test(text);
              return (
                <TableCell>
                  {isLevel ? <NivelBadge text={text} /> : children}
                </TableCell>
              );
            },
            strong: ({ children }) => {
              const text = String(children ?? "");
              const isLevel = /\b(alto|médio|medio|baixo)\b/i.test(text);
              return isLevel ? <NivelBadge text={text} /> : <strong>{children}</strong>;
            },
            ul: ({ children }) => (
              <ul className="space-y-1 list-disc pl-5">{children}</ul>
            ),
            li: ({ children }) => (
              <li className="first-letter:uppercase">{children}</li>
            ),
          }}
        >
          {section.content.trim()}
        </ReactMarkdown>
      </CardContent>
    </Card>
  );
}

// ── Main component ──

export default function TestePercentilResultado({
  pontuacoesFechadas,
  pontuacoesAbertas,
  scoreTotal,
  percentil,
  laudoIA,
  nivel,
  createdAt,
}: Props) {
  const band = getBandForPercentil(percentil);
  const bandName = getBandName(percentil);
  const percentilBadgeVariant = percentil >= 70 ? "default" : percentil >= 40 ? "secondary" : "destructive";

  const sanitizedLaudo = useMemo(() => (laudoIA ? sanitizeLaudo(laudoIA) : ""), [laudoIA]);
  const sections = useMemo(() => parseSections(sanitizedLaudo), [sanitizedLaudo]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Maturidade Executiva</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
            h1 { font-size: 1.5rem; } h2 { font-size: 1.25rem; margin-top: 1.5rem; }
            h3 { font-size: 1.1rem; } ul, ol { padding-left: 1.5rem; }
            table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>${sanitizedLaudo.replace(/\n/g, "<br>")}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
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
          <div className="mb-4">
            <span className="text-4xl font-bold text-foreground">{percentil}%</span>
          </div>
          <Progress value={percentil} className="h-3" />
        </CardContent>
      </Card>

      {/* Percentile Ruler */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Escala de Percentil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PercentileRuler percentil={percentil} />
        </CardContent>
      </Card>

      {/* General Score Card */}
      <Card className="border-2" style={{ borderColor: band.color }}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-5 w-5" style={{ color: band.color }} />
            Pontuação Geral — {bandName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center w-16 h-16 rounded-full text-white font-bold text-xl"
              style={{ backgroundColor: band.color }}
            >
              {percentil}%
            </div>
            <div>
              <p className="font-semibold text-foreground">{bandName}</p>
              <p className="text-sm text-muted-foreground capitalize">Nível: {nivel}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalhamento por Pilar */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Target className="h-4 w-4" />
          Detalhamento por Pilar
        </h3>
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
      {sanitizedLaudo && (
        <div className="space-y-4">
          <Separator className="my-2" />
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Laudo Consolidado
          </h3>
          {sections.length > 0 ? (
            <div className="space-y-4">
              {sections.map((section, i) => <SectionCard key={i} section={section} />)}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{sanitizedLaudo}</ReactMarkdown>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
