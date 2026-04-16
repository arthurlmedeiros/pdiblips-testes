import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { useTestesBussola } from "@/hooks/useTestesBussola";
import { toast } from "sonner";
import TesteBussolaResultado from "./TesteBussolaResultado";

interface Opcao {
  label: string;
  pontos: number;
}

interface Categoria {
  nome: string;
  opcoes: Opcao[];
}

const CATEGORIAS: Categoria[] = [
  { nome: "Renda", opcoes: [
    { label: "Não consigo pagar minhas contas básicas", pontos: 0 },
    { label: "Pago as contas, mas sem folga", pontos: 1 },
    { label: "Tenho alguma reserva financeira", pontos: 2 },
    { label: "Tenho renda confortável e investimentos", pontos: 3 },
    { label: "Tenho liberdade financeira plena", pontos: 4 },
  ]},
  { nome: "Entusiasmo", opcoes: [
    { label: "Estou completamente desmotivado(a)", pontos: 0 },
    { label: "Faço o mínimo necessário", pontos: 1 },
    { label: "Tenho dias bons e ruins", pontos: 2 },
    { label: "Sou motivado(a) na maioria dos dias", pontos: 3 },
    { label: "Acordo energizado(a) todos os dias", pontos: 4 },
  ]},
  { nome: "Network", opcoes: [
    { label: "Não tenho contatos profissionais relevantes", pontos: 0 },
    { label: "Conheço poucas pessoas na minha área", pontos: 1 },
    { label: "Tenho uma rede razoável de contatos", pontos: 2 },
    { label: "Tenho uma rede ativa e diversificada", pontos: 3 },
    { label: "Sou referência e conector na minha rede", pontos: 4 },
  ]},
  { nome: "Competência Técnica", opcoes: [
    { label: "Preciso de capacitação básica", pontos: 0 },
    { label: "Tenho conhecimento inicial na minha área", pontos: 1 },
    { label: "Sou competente no que faço", pontos: 2 },
    { label: "Sou especialista reconhecido(a)", pontos: 3 },
    { label: "Sou referência nacional/internacional", pontos: 4 },
  ]},
  { nome: "Equilíbrio Emocional", opcoes: [
    { label: "Estou constantemente estressado(a) ou ansioso(a)", pontos: 0 },
    { label: "Tenho dificuldade em lidar com pressão", pontos: 1 },
    { label: "Consigo me controlar na maioria das vezes", pontos: 2 },
    { label: "Tenho boa inteligência emocional", pontos: 3 },
    { label: "Sou equilibrado(a) mesmo em crises", pontos: 4 },
  ]},
  { nome: "Saúde Física", opcoes: [
    { label: "Tenho problemas sérios de saúde", pontos: 0 },
    { label: "Negligencio minha saúde frequentemente", pontos: 1 },
    { label: "Cuido da saúde de forma irregular", pontos: 2 },
    { label: "Mantenho rotina saudável consistente", pontos: 3 },
    { label: "Estou no melhor estado físico da minha vida", pontos: 4 },
  ]},
  { nome: "Contribuição Social", opcoes: [
    { label: "Não contribuo com causas sociais", pontos: 0 },
    { label: "Contribuo esporadicamente", pontos: 1 },
    { label: "Participo de alguma iniciativa social", pontos: 2 },
    { label: "Contribuo ativamente com minha comunidade", pontos: 3 },
    { label: "Lidero iniciativas de impacto social", pontos: 4 },
  ]},
  { nome: "Família", opcoes: [
    { label: "Tenho conflitos familiares graves", pontos: 0 },
    { label: "Relacionamento familiar distante", pontos: 1 },
    { label: "Relacionamento familiar razoável", pontos: 2 },
    { label: "Tenho uma família unida e presente", pontos: 3 },
    { label: "Minha família é meu maior suporte", pontos: 4 },
  ]},
  { nome: "Desenvolvimento Pessoal", opcoes: [
    { label: "Não invisto em meu desenvolvimento", pontos: 0 },
    { label: "Leio ou estudo raramente", pontos: 1 },
    { label: "Busco aprendizado de forma irregular", pontos: 2 },
    { label: "Tenho rotina consistente de aprendizado", pontos: 3 },
    { label: "Sou obcecado(a) por crescimento contínuo", pontos: 4 },
  ]},
  { nome: "Relacionamento Amoroso", opcoes: [
    { label: "Estou em um relacionamento tóxico ou muito insatisfeito(a)", pontos: 0 },
    { label: "Meu relacionamento tem muitos problemas", pontos: 1 },
    { label: "Tenho um relacionamento estável mas sem paixão", pontos: 2 },
    { label: "Tenho um relacionamento saudável e feliz", pontos: 3 },
    { label: "Vivo um relacionamento extraordinário", pontos: 4 },
  ]},
  { nome: "Diversão e Hobbies", opcoes: [
    { label: "Não tenho tempo para lazer", pontos: 0 },
    { label: "Raramente faço algo por prazer", pontos: 1 },
    { label: "Tenho alguns momentos de lazer", pontos: 2 },
    { label: "Pratico hobbies regularmente", pontos: 3 },
    { label: "Tenho uma vida rica em experiências prazerosas", pontos: 4 },
  ]},
  { nome: "Espiritualidade", opcoes: [
    { label: "Não tenho nenhuma prática espiritual", pontos: 0 },
    { label: "Tenho interesse mas não pratico", pontos: 1 },
    { label: "Pratico de forma irregular", pontos: 2 },
    { label: "Tenho uma prática espiritual consistente", pontos: 3 },
    { label: "A espiritualidade é central na minha vida", pontos: 4 },
  ]},
  { nome: "Propósito de Vida", opcoes: [
    { label: "Não sei qual é meu propósito", pontos: 0 },
    { label: "Tenho uma vaga ideia do que quero", pontos: 1 },
    { label: "Estou descobrindo meu propósito", pontos: 2 },
    { label: "Conheço meu propósito e trabalho nele", pontos: 3 },
    { label: "Vivo plenamente alinhado(a) ao meu propósito", pontos: 4 },
  ]},
  { nome: "Liderança", opcoes: [
    { label: "Não me vejo como líder", pontos: 0 },
    { label: "Lidero quando necessário, sem entusiasmo", pontos: 1 },
    { label: "Estou desenvolvendo minha liderança", pontos: 2 },
    { label: "Sou reconhecido(a) como bom líder", pontos: 3 },
    { label: "Sou um líder inspirador e transformador", pontos: 4 },
  ]},
  { nome: "Criatividade", opcoes: [
    { label: "Não me considero criativo(a)", pontos: 0 },
    { label: "Tenho ideias ocasionalmente", pontos: 1 },
    { label: "Sou criativo(a) em algumas situações", pontos: 2 },
    { label: "A criatividade é um dos meus pontos fortes", pontos: 3 },
    { label: "Sou constantemente inovador(a)", pontos: 4 },
  ]},
  { nome: "Ambiente de Trabalho", opcoes: [
    { label: "Meu ambiente de trabalho é tóxico", pontos: 0 },
    { label: "Tolero meu ambiente de trabalho", pontos: 1 },
    { label: "Meu ambiente é razoável", pontos: 2 },
    { label: "Gosto do meu ambiente de trabalho", pontos: 3 },
    { label: "Meu ambiente de trabalho é inspirador", pontos: 4 },
  ]},
  { nome: "Gestão do Tempo", opcoes: [
    { label: "Não consigo gerenciar meu tempo", pontos: 0 },
    { label: "Vivo apagando incêndios", pontos: 1 },
    { label: "Consigo me organizar em parte", pontos: 2 },
    { label: "Tenho boa gestão do tempo", pontos: 3 },
    { label: "Sou altamente produtivo(a) e equilibrado(a)", pontos: 4 },
  ]},
  { nome: "Comunicação", opcoes: [
    { label: "Tenho grande dificuldade em me comunicar", pontos: 0 },
    { label: "Me comunico de forma básica", pontos: 1 },
    { label: "Me comunico razoavelmente", pontos: 2 },
    { label: "Sou um bom comunicador(a)", pontos: 3 },
    { label: "Sou um comunicador(a) excepcional", pontos: 4 },
  ]},
  { nome: "Legado", opcoes: [
    { label: "Nunca pensei sobre meu legado", pontos: 0 },
    { label: "Tenho uma vaga ideia do legado que quero deixar", pontos: 1 },
    { label: "Estou começando a construir meu legado", pontos: 2 },
    { label: "Trabalho conscientemente no meu legado", pontos: 3 },
    { label: "Já estou construindo um legado significativo", pontos: 4 },
  ]},
];

interface Props {
  colaboradorId: string | undefined;
  onConcluido: () => void;
}

export default function TesteBussolaForm({ colaboradorId, onConcluido }: Props) {
  const { inserir } = useTestesBussola(colaboradorId);
  const [current, setCurrent] = useState(0);
  const [respostas, setRespostas] = useState<(number | null)[]>(
    new Array(CATEGORIAS.length).fill(null)
  );
  const [resultado, setResultado] = useState<{
    pontuacoes: Record<string, number>;
    respostas: Record<string, string>;
    total: number;
  } | null>(null);

  const progresso = ((current + 1) / CATEGORIAS.length) * 100;
  const categoria = CATEGORIAS[current];

  const handleSelect = (pontos: number) => {
    const nova = [...respostas];
    nova[current] = pontos;
    setRespostas(nova);
  };

  const handleFinalizar = async () => {
    const pontuacoes: Record<string, number> = {};
    const respostasTexto: Record<string, string> = {};
    let total = 0;

    CATEGORIAS.forEach((cat, i) => {
      const pts = respostas[i] ?? 0;
      pontuacoes[cat.nome] = pts;
      total += pts;
      const opcaoSelecionada = cat.opcoes.find((o) => o.pontos === pts);
      respostasTexto[cat.nome] = opcaoSelecionada?.label || "";
    });

    try {
      await inserir.mutateAsync({
        colaborador_id: colaboradorId || null,
        respostas: respostasTexto,
        pontuacoes,
        pontuacao_total: total,
      });
      setResultado({ pontuacoes, respostas: respostasTexto, total });
      toast.success("Bússola da Alta Performance concluída!");
    } catch {
      toast.error("Erro ao salvar o resultado");
    }
  };

  if (resultado) {
    return (
      <div className="space-y-4">
        <TesteBussolaResultado
          pontuacoes={resultado.pontuacoes}
          pontuacaoTotal={resultado.total}
          respostas={resultado.respostas}
        />
        <Button onClick={onConcluido}>Voltar ao histórico</Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {categoria.nome} — Pergunta {current + 1} de {CATEGORIAS.length}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onConcluido}>
            Cancelar
          </Button>
        </div>
        <Progress value={progresso} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-foreground font-medium">
          Como você avalia sua situação atual em relação a <strong>{categoria.nome}</strong>?
        </p>

        <RadioGroup
          value={respostas[current]?.toString() ?? ""}
          onValueChange={(v) => handleSelect(Number(v))}
        >
          {categoria.opcoes.map((op, i) => (
            <div
              key={i}
              className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <RadioGroupItem value={op.pontos.toString()} id={`bussola-op-${i}`} />
              <Label htmlFor={`bussola-op-${i}`} className="cursor-pointer flex-1">
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

          {current < CATEGORIAS.length - 1 ? (
            <Button
              onClick={() => setCurrent((c) => c + 1)}
              disabled={respostas[current] === null}
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
