import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, CheckCircle, Loader2, Send } from "lucide-react";
import { useTestesPercentil } from "@/hooks/useTestesPercentil";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import TestePercentilResultado from "./TestePercentilResultado";

// ── Types ──
interface PerguntaFechada {
  pilar: string;
  texto: string;
  opcoes: { key: string; label: string; pontos: number }[];
}

interface PerguntaAberta {
  pilar: string;
  texto: string;
}

// ── CONSTANTES: Perguntas Gerencial ──
const FECHADAS_GERENCIAL: PerguntaFechada[] = [
  {
    pilar: "Propriedade",
    texto: "Seu projeto atrasou por problemas na equipe e em outro departamento. Ao reportar ao diretor, você:",
    opcoes: [
      { key: "a", label: "Explica que o atraso foi causado pelo outro departamento e pela equipe", pontos: 1 },
      { key: "b", label: "Assume a responsabilidade total e apresenta um plano de recuperação", pontos: 5 },
      { key: "c", label: "Divide a culpa igualmente entre todos os envolvidos", pontos: 2 },
      { key: "d", label: "Minimiza o atraso dizendo que está tudo sob controle", pontos: 0 },
    ],
  },
  {
    pilar: "Propriedade",
    texto: "Um indicador da sua área ficou abaixo da meta por um fator de mercado imprevisível. Na reunião de resultados, você:",
    opcoes: [
      { key: "a", label: "Apresenta o fator externo como principal causa", pontos: 1 },
      { key: "b", label: "Reconhece que poderia ter antecipado cenários e propõe ações preventivas", pontos: 5 },
      { key: "c", label: "Sugere que a meta era irreal dadas as condições", pontos: 2 },
      { key: "d", label: "Foca nos indicadores que foram atingidos para compensar", pontos: 1 },
    ],
  },
  {
    pilar: "Execução Consistente",
    texto: "Você implementou feedbacks quinzenais com a equipe, mas só conseguiu fazer a primeira rodada. Sua reação:",
    opcoes: [
      { key: "a", label: "Cancela a iniciativa pois não teve tempo", pontos: 1 },
      { key: "b", label: "Culpa a rotina intensa pela falta de continuidade", pontos: 0 },
      { key: "c", label: "Analisa o que impediu, ajusta o formato e retoma com ritual fixo na agenda", pontos: 5 },
      { key: "d", label: "Delega a atividade para alguém da equipe continuar", pontos: 2 },
    ],
  },
  {
    pilar: "Execução Consistente",
    texto: "Um liderado com baixo desempenho está sobrecarregando o restante da equipe. Você:",
    opcoes: [
      { key: "a", label: "Espera a próxima avaliação de desempenho para abordar", pontos: 1 },
      { key: "b", label: "Redistribui as tarefas sem confrontar o liderado", pontos: 1 },
      { key: "c", label: "Tem uma conversa direta, define expectativas claras e acompanha semanalmente", pontos: 5 },
      { key: "d", label: "Pede ao RH para lidar com a situação", pontos: 0 },
    ],
  },
  {
    pilar: "Impacto e Influência",
    texto: "Você precisa que a equipe adote uma nova habilidade (análise de dados). Sua abordagem:",
    opcoes: [
      { key: "a", label: "Determina que todos façam o treinamento obrigatório", pontos: 0 },
      { key: "b", label: "Envia materiais e espera que se interessem", pontos: 1 },
      { key: "c", label: "Começa praticando você mesmo, mostra resultados e cria um programa gradual", pontos: 5 },
      { key: "d", label: "Contrata um consultor para treinar a equipe", pontos: 1 },
    ],
  },
  {
    pilar: "Impacto e Influência",
    texto: "Você precisa do apoio de um gerente de outra área para um projeto interdepartamental. Ele não demonstra interesse. Você:",
    opcoes: [
      { key: "a", label: "Escala para o diretor resolver", pontos: 1 },
      { key: "b", label: "Tenta convencer mostrando apenas os benefícios para sua área", pontos: 2 },
      { key: "c", label: "Identifica os interesses dele, mostra como o projeto beneficia ambas as áreas e propõe parceria", pontos: 5 },
      { key: "d", label: "Segue sem o apoio dele e tenta compensar internamente", pontos: 3 },
    ],
  },
  {
    pilar: "Autodesenvolvimento",
    texto: "Um processo que você implementou não está funcionando bem. Ao receber críticas da equipe:",
    opcoes: [
      { key: "a", label: "Defende o processo e pede mais tempo", pontos: 1 },
      { key: "b", label: "Ignora as críticas pois foram poucas", pontos: 1 },
      { key: "c", label: "Agradece o feedback, analisa os dados e ajusta o processo com a equipe", pontos: 5 },
      { key: "d", label: "Abandona o processo e volta ao anterior", pontos: 2 },
    ],
  },
  {
    pilar: "Autodesenvolvimento",
    texto: "Você tinha meta de ler 1 livro/mês de gestão, mas leu apenas 2 no semestre. Sua reflexão:",
    opcoes: [
      { key: "a", label: "Livros não são tão importantes, aprendo na prática", pontos: 1 },
      { key: "b", label: "Reconhece a falha, identifica o padrão de procrastinação e cria rituais diários de leitura", pontos: 5 },
      { key: "c", label: "Substitui por podcasts e vídeos mais curtos", pontos: 4 },
      { key: "d", label: "Desiste da meta por ser irreal", pontos: 0 },
    ],
  },
  {
    pilar: "Competências Globais",
    texto: "Sobre sua proficiência em inglês para negócios, você se considera:",
    opcoes: [
      { key: "a", label: "Não falo inglês e não vejo necessidade", pontos: 1 },
      { key: "b", label: "Tenho inglês básico e pretendo melhorar algum dia", pontos: 2 },
      { key: "c", label: "Consigo me comunicar em inglês profissionalmente", pontos: 4 },
      { key: "d", label: "Sou fluente e conduzo reuniões e negociações em inglês", pontos: 5 },
    ],
  },
  {
    pilar: "Competências Globais",
    texto: "Sobre influência e gestão de relacionamentos profissionais, você:",
    opcoes: [
      { key: "a", label: "Foco apenas nas tarefas, relacionamento é secundário", pontos: 1 },
      { key: "b", label: "Tenho bons relacionamentos dentro da minha equipe", pontos: 2 },
      { key: "c", label: "Mantenho uma rede ativa dentro e fora da empresa", pontos: 4 },
      { key: "d", label: "Sou referência como conector e influenciador na organização", pontos: 5 },
    ],
  },
];

const ABERTAS_GERENCIAL: PerguntaAberta[] = [
  { pilar: "Propriedade", texto: "Descreva um fracasso ou erro significativo em um projeto que você liderou. O que aconteceu? Qual foi sua responsabilidade real? O que você mudou depois?" },
  { pilar: "Execução Consistente", texto: "Descreva um projeto complexo que você entregou com sucesso envolvendo múltiplos stakeholders. Como você organizou a execução? Quais ferramentas e rituais usou?" },
  { pilar: "Impacto e Influência", texto: "Descreva uma situação em que teve que convencer um stakeholder sênior ou resistente a apoiar uma ideia sua. Como você conduziu o processo?" },
  { pilar: "Autodesenvolvimento", texto: "Qual foi o feedback mais difícil que você recebeu sobre seu estilo de liderança? O que fez com ele? Como isso mudou sua forma de liderar?" },
  { pilar: "Competências Globais", texto: "Descreva uma situação em que uma diferença cultural (regional, geracional ou organizacional) criou um conflito ou mal-entendido. Como você lidou com isso?" },
];

// ── CONSTANTES: Perguntas Diretoria ──
const FECHADAS_DIRETORIA: PerguntaFechada[] = [
  {
    pilar: "Propriedade",
    texto: "A empresa não bateu a meta anual, mas sua diretoria atingiu 110% dos objetivos. Na reunião do conselho:",
    opcoes: [
      { key: "a", label: "Apresenta os resultados da sua área como destaque", pontos: 1 },
      { key: "b", label: "Analisa por que a empresa falhou como um todo e o que poderia ter feito para contribuir mais", pontos: 5 },
      { key: "c", label: "Sugere que as outras diretorias precisam melhorar", pontos: 2 },
      { key: "d", label: "Propõe colaboração interdepartamental para o próximo ciclo", pontos: 4 },
    ],
  },
  {
    pilar: "Propriedade",
    texto: "Uma iniciativa estratégica que você patrocinou está enfrentando resistência interna significativa. Você:",
    opcoes: [
      { key: "a", label: "Impõe a decisão usando sua autoridade formal", pontos: 1 },
      { key: "b", label: "Revisita os fundamentos, busca entender as objeções e adapta a abordagem sem perder o objetivo", pontos: 5 },
      { key: "c", label: "Abandona a iniciativa para não criar mais conflito", pontos: 2 },
      { key: "d", label: "Delega a gestão da resistência para o RH", pontos: 1 },
    ],
  },
  {
    pilar: "Execução Consistente",
    texto: "Uma transformação cultural que você liderou perdeu força após 6 meses. Sua abordagem:",
    opcoes: [
      { key: "a", label: "Lança uma nova campanha de comunicação interna", pontos: 1 },
      { key: "b", label: "Reconhece que faltou infraestrutura de sustentação e reforça rituais", pontos: 2 },
      { key: "c", label: "Faz diagnóstico profundo, identifica barreiras sistêmicas e redesenha a abordagem com co-criação", pontos: 5 },
      { key: "d", label: "Desiste e foca em resultados de curto prazo", pontos: 0 },
    ],
  },
  {
    pilar: "Execução Consistente",
    texto: "Um diretor subordinado é um gênio técnico mas péssimo gestor de pessoas, causando turnover alto. Você:",
    opcoes: [
      { key: "a", label: "Tolera pois os resultados técnicos são excelentes", pontos: 1 },
      { key: "b", label: "Tem conversa franca, define plano de desenvolvimento com prazo claro e acompanha pessoalmente", pontos: 5 },
      { key: "c", label: "Coloca um HRBP para compensar as deficiências", pontos: 2 },
      { key: "d", label: "Move para uma posição individual contributor", pontos: 0 },
    ],
  },
  {
    pilar: "Impacto e Influência",
    texto: "A empresa quer ser data-driven, mas os líderes continuam tomando decisões por intuição. Você:",
    opcoes: [
      { key: "a", label: "Manda todo mundo fazer curso de analytics", pontos: 0 },
      { key: "b", label: "Cria dashboards e espera que usem", pontos: 2 },
      { key: "c", label: "Lidera pelo exemplo, usa dados nas suas decisões, celebra quando outros fazem o mesmo e cria incentivos", pontos: 5 },
      { key: "d", label: "Contrata um Chief Data Officer para resolver", pontos: 1 },
    ],
  },
  {
    pilar: "Impacto e Influência",
    texto: "Você precisa comunicar um corte de 50% no bônus anual para toda a organização. Sua abordagem:",
    opcoes: [
      { key: "a", label: "Envia um email corporativo explicando a situação", pontos: 1 },
      { key: "b", label: "Assume pessoalmente a comunicação, explica o contexto com transparência, mostra o plano de recuperação e abre para perguntas", pontos: 5 },
      { key: "c", label: "Delega para os gestores comunicarem em suas equipes", pontos: 4 },
      { key: "d", label: "Adia a comunicação esperando o cenário melhorar", pontos: 0 },
    ],
  },
  {
    pilar: "Autodesenvolvimento",
    texto: "Sua estratégia de produto está perdendo tração no mercado. Ao receber feedback do board:",
    opcoes: [
      { key: "a", label: "Defende a estratégia atual com mais dados", pontos: 1 },
      { key: "b", label: "Questiona se o feedback é baseado em dados suficientes", pontos: 2 },
      { key: "c", label: "Absorve o feedback, faz análise profunda do mercado e propõe pivotagem fundamentada", pontos: 5 },
      { key: "d", label: "Contrata consultoria externa para validar", pontos: 1 },
    ],
  },
  {
    pilar: "Autodesenvolvimento",
    texto: "Você aceitou participar de um conselho de startup, mas sua participação tem sido superficial. Sua reflexão:",
    opcoes: [
      { key: "a", label: "Está tudo bem, é mais networking", pontos: 1 },
      { key: "b", label: "Reconhece que precisa se comprometer de verdade ou sair, toma uma decisão e age", pontos: 5 },
      { key: "c", label: "Reduz a frequência das reuniões", pontos: 2 },
      { key: "d", label: "Ignora pois não é prioridade", pontos: 0 },
    ],
  },
  {
    pilar: "Competências Globais",
    texto: "Sobre sua proficiência em inglês para interações com investidores e parceiros globais:",
    opcoes: [
      { key: "a", label: "Uso intérprete quando necessário", pontos: 2 },
      { key: "b", label: "Consigo me comunicar mas com limitações em negociações complexas", pontos: 3 },
      { key: "c", label: "Sou fluente em contextos de negócios", pontos: 4 },
      { key: "d", label: "Conduzo board meetings e negociações estratégicas em inglês com naturalidade", pontos: 5 },
    ],
  },
  {
    pilar: "Competências Globais",
    texto: "Sobre influência social e rede profissional fora da empresa:",
    opcoes: [
      { key: "a", label: "Minha rede é basicamente interna", pontos: 1 },
      { key: "b", label: "Participo de alguns eventos e associações", pontos: 2 },
      { key: "c", label: "Tenho rede ativa com executivos de outras empresas e mentores", pontos: 4 },
      { key: "d", label: "Sou referência no mercado, palestrante e convidado para conselhos", pontos: 5 },
    ],
  },
];

const ABERTAS_DIRETORIA: PerguntaAberta[] = [
  { pilar: "Propriedade", texto: "Descreva uma situação em que teve que assumir responsabilidade por um fracasso estratégico que não foi exclusivamente seu. Como liderou a recuperação?" },
  { pilar: "Execução Consistente", texto: "Descreva uma iniciativa estratégica de longo prazo (mais de 1 ano) que você liderou do início ao fim. Como manteve a execução consistente ao longo do tempo?" },
  { pilar: "Impacto e Influência", texto: "Descreva uma situação em que teve que influenciar o Conselho ou investidores a apoiar uma visão ousada ou impopular. Como conduziu esse processo?" },
  { pilar: "Autodesenvolvimento", texto: "Qual competência você mais precisa desenvolver para liderar a organização rumo ao futuro? O que está fazendo a respeito?" },
  { pilar: "Competências Globais", texto: "Descreva uma situação em que mediou um conflito cultural entre equipes de diferentes países ou culturas organizacionais distintas. Qual foi sua abordagem?" },
];

// ── Component ──
interface Props {
  colaboradorId: string | undefined;
  nivel: "gerencial" | "diretoria";
  onConcluido: () => void;
}

type Etapa = "fechadas" | "abertas" | "processando";

export default function TestePercentilForm({ colaboradorId, nivel, onConcluido }: Props) {
  const { inserir, atualizar } = useTestesPercentil(colaboradorId);

  const fechadas = nivel === "gerencial" ? FECHADAS_GERENCIAL : FECHADAS_DIRETORIA;
  const abertas = nivel === "gerencial" ? ABERTAS_GERENCIAL : ABERTAS_DIRETORIA;

  const [etapa, setEtapa] = useState<Etapa>("fechadas");
  const [currentQ, setCurrentQ] = useState(0);
  const [respostasFechadas, setRespostasFechadas] = useState<(string | null)[]>(
    new Array(fechadas.length).fill(null)
  );
  const [respostasAbertas, setRespostasAbertas] = useState<string[]>(
    new Array(abertas.length).fill("")
  );
  const [resultado, setResultado] = useState<any>(null);
  const [processandoMsg, setProcessandoMsg] = useState("Iniciando análise...");

  // ── Etapa 1: Fechadas ──
  const handleSelectFechada = (key: string) => {
    const nova = [...respostasFechadas];
    nova[currentQ] = key;
    setRespostasFechadas(nova);
  };

  const calcularPontuacoesFechadas = () => {
    const pontuacoes: Record<string, number> = {};
    fechadas.forEach((p, i) => {
      const selected = respostasFechadas[i];
      const opcao = p.opcoes.find((o) => o.key === selected);
      const pts = opcao?.pontos ?? 0;
      pontuacoes[p.pilar] = (pontuacoes[p.pilar] || 0) + pts;
    });
    return pontuacoes;
  };

  const handleFinalizarFechadas = () => {
    setEtapa("abertas");
  };

  // ── Etapa 2: Abertas ──
  const handleAbertaChange = (index: number, value: string) => {
    const nova = [...respostasAbertas];
    nova[index] = value;
    setRespostasAbertas(nova);
  };

  const handleEnviarParaIA = async () => {
    setEtapa("processando");
    setProcessandoMsg("Salvando respostas...");

    try {
      const pontuacoesFechadas = calcularPontuacoesFechadas();

      const respostasFechadasObj: Record<string, string> = {};
      fechadas.forEach((p, i) => {
        respostasFechadasObj[`q${i + 1}`] = respostasFechadas[i] || "";
      });

      const respostasAbertasObj: Record<string, string> = {};
      abertas.forEach((p, i) => {
        respostasAbertasObj[p.pilar] = respostasAbertas[i];
      });

      // Create record
      const registro = await inserir.mutateAsync({
        colaborador_id: colaboradorId || null,
        nivel,
        respostas_fechadas: respostasFechadasObj,
        respostas_abertas: respostasAbertasObj,
        pontuacoes_fechadas: pontuacoesFechadas,
        status: "aguardando_ia",
      });

      setProcessandoMsg("Analisando respostas com IA (5 pilares)...");

      // Call edge function
      const respostasParaIA = abertas.map((p, i) => ({
        pilar: p.pilar,
        pergunta: p.texto,
        resposta: respostasAbertas[i],
      }));

      const { data: funcData, error: funcError } = await supabase.functions.invoke(
        "percentil-ai",
        {
          body: {
            action: "avaliar_abertas",
            nivel,
            respostas: respostasParaIA,
          },
        }
      );

      if (funcError) throw funcError;

      setProcessandoMsg("Calculando percentil...");

      const resultadosIA = funcData.resultados || [];
      const laudoIA = funcData.laudo || "";

      // Calculate scores
      const scoreFechadas = Object.values(pontuacoesFechadas).reduce(
        (sum: number, v: any) => sum + (v as number),
        0
      );
      const scoreAbertas = resultadosIA.reduce(
        (sum: number, r: any) => sum + (r.score_final_pergunta || 0),
        0
      );
      const scoreTotal = scoreFechadas + scoreAbertas;
      const maxScore = 75; // 50 (fechadas max) + 25 (abertas max)
      const percentil = Math.round((scoreTotal / maxScore) * 100);

      // Update record
      await atualizar.mutateAsync({
        id: registro.id,
        pontuacoes_abertas: resultadosIA,
        score_total: scoreTotal,
        percentil,
        laudo_ia: laudoIA,
        status: "concluido",
      });

      setResultado({
        pontuacoesFechadas,
        pontuacoesAbertas: resultadosIA,
        scoreTotal,
        percentil,
        laudoIA,
        nivel,
        createdAt: registro.created_at,
      });

      toast.success("Teste de Maturidade Executiva concluído!");
    } catch (err: any) {
      console.error("Erro ao processar teste:", err);
      toast.error(err?.message || "Erro ao processar o teste");
      setEtapa("abertas");
    }
  };

  // ── Resultado ──
  if (resultado) {
    return (
      <div className="space-y-4">
        <TestePercentilResultado
          pontuacoesFechadas={resultado.pontuacoesFechadas}
          pontuacoesAbertas={resultado.pontuacoesAbertas}
          scoreTotal={resultado.scoreTotal}
          percentil={resultado.percentil}
          laudoIA={resultado.laudoIA}
          nivel={resultado.nivel}
          createdAt={resultado.createdAt}
        />
        <Button onClick={onConcluido}>Voltar ao histórico</Button>
      </div>
    );
  }

  // ── Etapa: Processando ──
  if (etapa === "processando") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-foreground font-medium">{processandoMsg}</p>
          <p className="text-sm text-muted-foreground">
            Isso pode levar alguns segundos...
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Etapa: Abertas ──
  if (etapa === "abertas") {
    const todasPreenchidas = respostasAbertas.every((r) => r.trim().length >= 20);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Perguntas Abertas — {nivel === "gerencial" ? "Nível Gerencial" : "Nível Diretoria"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Responda com detalhes (mínimo 20 caracteres cada). Suas respostas serão analisadas por IA.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {abertas.map((p, i) => (
            <div key={i} className="space-y-2">
              <Label className="text-sm font-medium">
                <span className="text-primary font-bold">{p.pilar}</span> — Pergunta {i + 1} de {abertas.length}
              </Label>
              <p className="text-sm text-foreground">{p.texto}</p>
              <Textarea
                value={respostasAbertas[i]}
                onChange={(e) => handleAbertaChange(i, e.target.value)}
                placeholder="Descreva sua experiência em detalhes..."
                className="min-h-[120px]"
              />
              {respostasAbertas[i].trim().length > 0 && respostasAbertas[i].trim().length < 20 && (
                <p className="text-xs text-destructive">Mínimo 20 caracteres</p>
              )}
            </div>
          ))}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setEtapa("fechadas")}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Voltar às fechadas
            </Button>
            <Button onClick={handleEnviarParaIA} disabled={!todasPreenchidas}>
              <Send className="mr-1 h-4 w-4" /> Enviar para Análise
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Etapa: Fechadas ──
  const pergunta = fechadas[currentQ];
  const progresso = ((currentQ + 1) / fechadas.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          <span className="text-primary">{pergunta.pilar}</span> — Pergunta {currentQ + 1} de {fechadas.length}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {nivel === "gerencial" ? "Nível Gerencial" : "Nível Diretoria"}
        </p>
        <Progress value={progresso} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-foreground font-medium">{pergunta.texto}</p>

        <RadioGroup
          value={respostasFechadas[currentQ] ?? ""}
          onValueChange={handleSelectFechada}
        >
          {pergunta.opcoes.map((op) => (
            <div
              key={op.key}
              className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <RadioGroupItem value={op.key} id={`pct-${currentQ}-${op.key}`} className="mt-0.5" />
              <Label htmlFor={`pct-${currentQ}-${op.key}`} className="cursor-pointer flex-1 text-sm">
                {op.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentQ((c) => c - 1)}
            disabled={currentQ === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
          </Button>

          {currentQ < fechadas.length - 1 ? (
            <Button
              onClick={() => setCurrentQ((c) => c + 1)}
              disabled={respostasFechadas[currentQ] === null}
            >
              Próximo <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFinalizarFechadas}
              disabled={respostasFechadas.some((r) => r === null)}
            >
              <CheckCircle className="mr-1 h-4 w-4" /> Avançar para Abertas
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
