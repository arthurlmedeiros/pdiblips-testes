import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { useTestesPerfil } from "@testes/hooks/useTestesPerfil";
import { toast } from "sonner";
import TestePerfilResultado from "./TestePerfilResultado";

type Perfil = "idealista" | "focado" | "afetivo" | "organizado";

interface Pergunta {
  texto: string;
  opcoes: { label: string; perfil: Perfil }[];
}

const PERGUNTAS_BASE: Pergunta[] = [
  { texto: "Quando preciso resolver um problema complexo, eu costumo:", opcoes: [
    { label: "Pensar em soluções inovadoras e fora do padrão", perfil: "idealista" },
    { label: "Analisar dados e fatos antes de agir", perfil: "focado" },
    { label: "Consultar a equipe para ouvir diferentes perspectivas", perfil: "afetivo" },
    { label: "Seguir um plano estruturado e metódico", perfil: "organizado" },
  ]},
  { texto: "Em uma reunião de equipe, meu papel natural é:", opcoes: [
    { label: "Propor ideias e visões de futuro", perfil: "idealista" },
    { label: "Manter o foco nos resultados e metas", perfil: "focado" },
    { label: "Garantir que todos se sintam ouvidos", perfil: "afetivo" },
    { label: "Organizar a pauta e acompanhar os prazos", perfil: "organizado" },
  ]},
  { texto: "O que mais me motiva no trabalho é:", opcoes: [
    { label: "Transformar realidades e criar algo novo", perfil: "idealista" },
    { label: "Atingir metas e superar desafios", perfil: "focado" },
    { label: "Construir relacionamentos significativos", perfil: "afetivo" },
    { label: "Ter processos claros e bem definidos", perfil: "organizado" },
  ]},
  { texto: "Quando enfrento uma mudança inesperada, minha primeira reação é:", opcoes: [
    { label: "Ver como uma oportunidade de inovar", perfil: "idealista" },
    { label: "Avaliar o impacto nos resultados", perfil: "focado" },
    { label: "Verificar como a equipe está lidando", perfil: "afetivo" },
    { label: "Reorganizar planos e prioridades", perfil: "organizado" },
  ]},
  { texto: "Meu maior ponto forte é:", opcoes: [
    { label: "Criatividade e visão estratégica", perfil: "idealista" },
    { label: "Determinação e orientação para resultados", perfil: "focado" },
    { label: "Empatia e habilidade interpessoal", perfil: "afetivo" },
    { label: "Disciplina e atenção aos detalhes", perfil: "organizado" },
  ]},
  { texto: "Para tomar uma decisão importante, eu priorizo:", opcoes: [
    { label: "O impacto a longo prazo e o propósito", perfil: "idealista" },
    { label: "Os números e indicadores de performance", perfil: "focado" },
    { label: "O bem-estar das pessoas envolvidas", perfil: "afetivo" },
    { label: "A análise de riscos e planejamento", perfil: "organizado" },
  ]},
  { texto: "Em situações de conflito, eu prefiro:", opcoes: [
    { label: "Buscar uma solução criativa que agrade a todos", perfil: "idealista" },
    { label: "Resolver rapidamente para não atrasar resultados", perfil: "focado" },
    { label: "Mediar e buscar entendimento entre as partes", perfil: "afetivo" },
    { label: "Aplicar regras e procedimentos existentes", perfil: "organizado" },
  ]},
  { texto: "Quando lidero um projeto, meu foco principal é:", opcoes: [
    { label: "Inspirar a equipe com a visão do projeto", perfil: "idealista" },
    { label: "Garantir a entrega no prazo e no orçamento", perfil: "focado" },
    { label: "Desenvolver e motivar cada membro da equipe", perfil: "afetivo" },
    { label: "Definir processos e acompanhar cada etapa", perfil: "organizado" },
  ]},
  { texto: "Meu ambiente de trabalho ideal é:", opcoes: [
    { label: "Dinâmico, com espaço para experimentação", perfil: "idealista" },
    { label: "Orientado a metas com métricas claras", perfil: "focado" },
    { label: "Colaborativo e com bom clima organizacional", perfil: "afetivo" },
    { label: "Estruturado com processos bem definidos", perfil: "organizado" },
  ]},
  { texto: "O feedback que mais recebo é:", opcoes: [
    { label: "Que sou visionário e inspirador", perfil: "idealista" },
    { label: "Que sou direto e eficiente", perfil: "focado" },
    { label: "Que sou acolhedor e bom ouvinte", perfil: "afetivo" },
    { label: "Que sou detalhista e organizado", perfil: "organizado" },
  ]},
  { texto: "Ao avaliar o desempenho de alguém, priorizo:", opcoes: [
    { label: "A capacidade de inovar e pensar diferente", perfil: "idealista" },
    { label: "Os resultados entregues e metas batidas", perfil: "focado" },
    { label: "O trabalho em equipe e colaboração", perfil: "afetivo" },
    { label: "O cumprimento de processos e qualidade", perfil: "organizado" },
  ]},
  { texto: "Quando preciso comunicar uma decisão difícil, eu:", opcoes: [
    { label: "Contextualizo com a visão e propósito maior", perfil: "idealista" },
    { label: "Vou direto ao ponto com clareza", perfil: "focado" },
    { label: "Preparo as pessoas e ofereço suporte", perfil: "afetivo" },
    { label: "Documento e apresento com dados estruturados", perfil: "organizado" },
  ]},
  { texto: "Minha maior frustração no trabalho é:", opcoes: [
    { label: "Falta de espaço para inovação", perfil: "idealista" },
    { label: "Não atingir as metas estabelecidas", perfil: "focado" },
    { label: "Conflitos e desarmonia na equipe", perfil: "afetivo" },
    { label: "Desorganização e falta de processos", perfil: "organizado" },
  ]},
  { texto: "Para me desenvolver profissionalmente, busco:", opcoes: [
    { label: "Workshops de inovação e pensamento disruptivo", perfil: "idealista" },
    { label: "Treinamentos de alta performance e liderança", perfil: "focado" },
    { label: "Cursos de inteligência emocional e coaching", perfil: "afetivo" },
    { label: "Certificações e metodologias de gestão", perfil: "organizado" },
  ]},
  { texto: "Quando a equipe está desmotivada, eu:", opcoes: [
    { label: "Reforço a visão e o propósito do trabalho", perfil: "idealista" },
    { label: "Defino novos desafios e metas estimulantes", perfil: "focado" },
    { label: "Converso individualmente para entender cada um", perfil: "afetivo" },
    { label: "Reviso processos para eliminar frustrações", perfil: "organizado" },
  ]},
  { texto: "Na hora de delegar tarefas, eu:", opcoes: [
    { label: "Dou liberdade criativa e autonomia", perfil: "idealista" },
    { label: "Defino metas claras e cobro resultados", perfil: "focado" },
    { label: "Considero as habilidades e preferências de cada um", perfil: "afetivo" },
    { label: "Crio instruções detalhadas e checklists", perfil: "organizado" },
  ]},
  { texto: "Minha abordagem para planejamento estratégico é:", opcoes: [
    { label: "Foco em tendências e cenários futuros", perfil: "idealista" },
    { label: "Definição de KPIs e métricas de sucesso", perfil: "focado" },
    { label: "Engajamento de stakeholders e construção de consenso", perfil: "afetivo" },
    { label: "Cronograma detalhado com milestones", perfil: "organizado" },
  ]},
  { texto: "Em uma crise, minha primeira ação é:", opcoes: [
    { label: "Pensar em alternativas criativas", perfil: "idealista" },
    { label: "Agir rapidamente para minimizar danos", perfil: "focado" },
    { label: "Reunir a equipe e alinhar a comunicação", perfil: "afetivo" },
    { label: "Ativar o plano de contingência", perfil: "organizado" },
  ]},
  { texto: "O que mais valorizo em um colega de trabalho:", opcoes: [
    { label: "Pensamento inovador e ousadia", perfil: "idealista" },
    { label: "Comprometimento com resultados", perfil: "focado" },
    { label: "Espírito de equipe e lealdade", perfil: "afetivo" },
    { label: "Responsabilidade e pontualidade", perfil: "organizado" },
  ]},
  { texto: "Minha relação com prazos é:", opcoes: [
    { label: "Flexível - o importante é a qualidade da ideia", perfil: "idealista" },
    { label: "Rigorosa - prazo é compromisso", perfil: "focado" },
    { label: "Adaptável - depende do contexto da equipe", perfil: "afetivo" },
    { label: "Precisa - planejo para entregar antes", perfil: "organizado" },
  ]},
  { texto: "Quando recebo feedback negativo, eu:", opcoes: [
    { label: "Reflito sobre como melhorar e inovar", perfil: "idealista" },
    { label: "Foco em corrigir rapidamente e seguir em frente", perfil: "focado" },
    { label: "Avalio o impacto emocional e busco diálogo", perfil: "afetivo" },
    { label: "Analiso os pontos e crio um plano de melhoria", perfil: "organizado" },
  ]},
  { texto: "Meu estilo de comunicação é:", opcoes: [
    { label: "Inspirador e visionário", perfil: "idealista" },
    { label: "Direto e objetivo", perfil: "focado" },
    { label: "Empático e inclusivo", perfil: "afetivo" },
    { label: "Preciso e detalhado", perfil: "organizado" },
  ]},
  { texto: "Para celebrar uma conquista da equipe, eu:", opcoes: [
    { label: "Compartilho a visão do próximo desafio", perfil: "idealista" },
    { label: "Reconheço publicamente os melhores resultados", perfil: "focado" },
    { label: "Organizo um momento de confraternização", perfil: "afetivo" },
    { label: "Documento as lições aprendidas do projeto", perfil: "organizado" },
  ]},
  { texto: "O tipo de projeto que mais me energiza é:", opcoes: [
    { label: "Projetos inovadores sem precedentes", perfil: "idealista" },
    { label: "Projetos com metas ambiciosas e mensuráveis", perfil: "focado" },
    { label: "Projetos colaborativos com grande impacto social", perfil: "afetivo" },
    { label: "Projetos complexos que exigem planejamento minucioso", perfil: "organizado" },
  ]},
  { texto: "Se pudesse escolher um legado profissional, seria:", opcoes: [
    { label: "Ter transformado uma indústria com ideias revolucionárias", perfil: "idealista" },
    { label: "Ter construído uma organização de alta performance", perfil: "focado" },
    { label: "Ter desenvolvido pessoas e criado uma cultura inspiradora", perfil: "afetivo" },
    { label: "Ter criado sistemas e processos que perduram", perfil: "organizado" },
  ]},
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  colaboradorId: string;
  onConcluido: () => void;
}

export default function TestePerfilForm({ colaboradorId, onConcluido }: Props) {
  const { inserir } = useTestesPerfil(colaboradorId);

  const perguntas = useMemo(() => {
    return shuffle(PERGUNTAS_BASE).map((p) => ({
      ...p,
      opcoes: shuffle(p.opcoes),
    }));
  }, []);

  const [current, setCurrent] = useState(0);
  const [respostas, setRespostas] = useState<(Perfil | null)[]>(
    new Array(25).fill(null)
  );
  const [resultado, setResultado] = useState<{
    resultado: Record<string, number>;
    dominante: string;
  } | null>(null);

  const progresso = ((current + 1) / 25) * 100;

  const handleSelect = (perfil: Perfil) => {
    const nova = [...respostas];
    nova[current] = perfil;
    setRespostas(nova);
  };

  const handleFinalizar = async () => {
    const counts: Record<string, number> = {
      idealista: 0,
      focado: 0,
      afetivo: 0,
      organizado: 0,
    };
    respostas.forEach((r) => {
      if (r) counts[r]++;
    });

    const dominante = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

    const respostasCompletas = perguntas.map((p, i) => ({
      pergunta: p.texto,
      resposta: respostas[i],
    }));

    try {
      await inserir.mutateAsync({
        colaborador_id: colaboradorId,
        respostas: respostasCompletas,
        resultado: counts,
        perfil_dominante: dominante,
      });
      setResultado({ resultado: counts, dominante });
      toast.success("Teste de perfil concluído!");
    } catch {
      toast.error("Erro ao salvar o resultado");
    }
  };

  if (resultado) {
    return (
      <div className="space-y-4">
        <TestePerfilResultado
          resultado={resultado.resultado}
          perfilDominante={resultado.dominante}
        />
        <Button onClick={onConcluido}>Voltar ao histórico</Button>
      </div>
    );
  }

  const perguntaAtual = perguntas[current];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Pergunta {current + 1} de 25
        </CardTitle>
        <Progress value={progresso} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-foreground font-medium">{perguntaAtual.texto}</p>

        <RadioGroup
          value={respostas[current] || ""}
          onValueChange={(v) => handleSelect(v as Perfil)}
        >
          {perguntaAtual.opcoes.map((op, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
              <RadioGroupItem value={op.perfil} id={`op-${i}`} />
              <Label htmlFor={`op-${i}`} className="cursor-pointer flex-1">
                {op.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrent((c) => c - 1)}
            disabled={current === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
          </Button>

          {current < 24 ? (
            <Button
              onClick={() => setCurrent((c) => c + 1)}
              disabled={!respostas[current]}
            >
              Próximo <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFinalizar}
              disabled={respostas.some((r) => r === null) || inserir.isPending}
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              {inserir.isPending ? "Salvando..." : "Finalizar"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
