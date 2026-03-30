import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Clock,
  BarChart3,
  Target,
  ThumbsUp,
  AlertTriangle,
  Award,
  Lightbulb,
} from "lucide-react";

interface Props {
  laudo: string;
  createdAt?: string;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  "resumo executivo": <FileText className="h-5 w-5 text-primary" />,
  "linha do tempo profissional": <Clock className="h-5 w-5 text-primary" />,
  "resultados da avaliação": <BarChart3 className="h-5 w-5 text-primary" />,
  "competências-chave": <Target className="h-5 w-5 text-primary" />,
  "pontos fortes": <ThumbsUp className="h-5 w-5 text-emerald-500" />,
  "gaps e oportunidades de desenvolvimento": <AlertTriangle className="h-5 w-5 text-amber-500" />,
  "nível de senioridade estimado": <Award className="h-5 w-5 text-primary" />,
  "recomendações": <Lightbulb className="h-5 w-5 text-primary" />,
};

function getIcon(title: string) {
  const key = title.toLowerCase().trim();
  for (const [k, icon] of Object.entries(SECTION_ICONS)) {
    if (key.includes(k)) return icon;
  }
  return <FileText className="h-5 w-5 text-primary" />;
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

interface Section {
  title: string;
  content: string;
}

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
    if (/^##\s+Recomendações/i.test(line)) foundRecomendacoes = true;

    if (foundRecomendacoes && !line.startsWith("##")) {
      const isAgentTalk = AGENT_TALK_PATTERNS.some((p) => p.test(line.trim()));
      if (isAgentTalk) continue;
    }

    const trimmed = line.trim();
    if (trimmed && AGENT_TALK_PATTERNS.some((p) => p.test(trimmed))) continue;

    cleaned.push(line);
  }

  return cleaned.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function parseSections(md: string): Section[] {
  const lines = md.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)/);
    if (h2Match) {
      if (current) sections.push(current);
      current = { title: h2Match[1].trim(), content: "" };
    } else if (current) {
      current.content += line + "\n";
    }
  }
  if (current) sections.push(current);
  return sections;
}

const YEAR_REGEX = /\b((19|20)\d{2})\b/g;

function extractPeriod(text: string): string | null {
  const rangeMatch = text.match(/\b(19|20)\d{2}\s*[–\-—]\s*(19|20)\d{2}|\b(19|20)\d{2}\s*[–\-—]\s*atual/i);
  if (rangeMatch) return rangeMatch[0];
  const years = text.match(YEAR_REGEX);
  return years?.[0] ?? null;
}

function TimelineSection({ section }: { section: Section }) {
  const lines = section.content.split("\n");
  const items = lines
    .filter((l) => /^[-*•]\s+/.test(l.trim()) || /^\d+\.\s+/.test(l.trim()))
    .map((l) => l.replace(/^[-*•\d.]+\s+/, "").trim())
    .filter(Boolean);

  if (items.length === 0) {
    return <SectionCard section={section} />;
  }

  return (
    <Card className="bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {getIcon(section.title)}
          {section.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-8">
          <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-primary/20 rounded-full" />
          <div className="space-y-6">
            {items.map((item, i) => {
              const period = extractPeriod(item);
              const text = period ? item.replace(period, "").replace(/^[:\s–\-—]+/, "").trim() : item;
              return (
                <div key={i} className="relative flex items-start gap-3">
                  <div className="absolute -left-5 mt-1 w-3 h-3 rounded-full bg-primary border-2 border-background shadow" />
                  <div className="flex flex-col gap-1 min-w-0">
                    {period && (
                      <Badge variant="outline" className="w-fit text-xs font-mono shrink-0">
                        {period}
                      </Badge>
                    )}
                    <p className="text-sm text-foreground leading-relaxed">{text || item}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SenioridadeBadge({ content }: { content: string }) {
  const match = content.match(/\b(júnior|pleno|sênior|senior|executivo|c-level|especialista|director|diretor)\b/i);
  if (!match) return null;
  const nivel = match[0];
  const colorMap: Record<string, string> = {
    júnior: "bg-slate-500/15 text-slate-700 border-slate-300",
    pleno: "bg-blue-500/15 text-blue-700 border-blue-300",
    sênior: "bg-emerald-500/15 text-emerald-700 border-emerald-300",
    senior: "bg-emerald-500/15 text-emerald-700 border-emerald-300",
    executivo: "bg-violet-500/15 text-violet-700 border-violet-300",
    "c-level": "bg-violet-500/15 text-violet-700 border-violet-300",
    especialista: "bg-primary/15 text-primary border-primary/30",
    director: "bg-amber-500/15 text-amber-700 border-amber-300",
    diretor: "bg-amber-500/15 text-amber-700 border-amber-300",
  };
  const cls = colorMap[nivel.toLowerCase()] ?? "bg-muted text-foreground";
  return (
    <Badge className={`text-sm px-3 py-1 font-semibold capitalize ${cls}`}>
      {nivel}
    </Badge>
  );
}

function SectionCard({ section }: { section: Section }) {
  const key = section.title.toLowerCase().trim();
  const isResumo = key.includes("resumo executivo");
  const isSenioridade = key.includes("senioridade");

  const cardClass = isResumo ? "bg-primary/5 border-primary/20" : "bg-card/50";

  if (isSenioridade) {
    return (
      <Card className={cardClass}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {getIcon(section.title)}
            {section.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-center">
            <SenioridadeBadge content={section.content} />
          </div>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content.trim()}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardClass}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {getIcon(section.title)}
          {section.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm max-w-none dark:prose-invert">
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

export default function TesteCLevelResultado({ laudo, createdAt }: Props) {
  const sections = useMemo(() => parseSections(sanitizeLaudo(laudo)), [laudo]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Laudo C-Level</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
            h1 { font-size: 1.5rem; } h2 { font-size: 1.25rem; margin-top: 1.5rem; }
            h3 { font-size: 1.1rem; } ul, ol { padding-left: 1.5rem; }
            table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>${laudo.replace(/\n/g, "<br>")}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Laudo C-Level</h2>
          {createdAt && (
            <p className="text-xs text-muted-foreground">
              Gerado em {new Date(createdAt).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir
        </Button>
      </div>

      {sections.length > 0 ? (
        sections.map((section, i) => {
          const isTimeline = section.title.toLowerCase().includes("linha do tempo");
          return isTimeline
            ? <TimelineSection key={i} section={section} />
            : <SectionCard key={i} section={section} />;
        })
      ) : (
        <Card>
          <CardContent className="pt-6 prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{laudo}</ReactMarkdown>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
