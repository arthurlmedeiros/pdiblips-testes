import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, Send, ArrowRight } from "lucide-react";
import { useTestesCLevel } from "@testes/hooks/useTestesCLevel";
import { supabase } from "@core/integrations/supabase/client";
import { toast } from "sonner";
import TesteCLevelResultado from "./TesteCLevelResultado";

const PERGUNTAS_INICIAIS = [
  "Descreva sua trajetória profissional e os principais marcos que definiram sua carreira até aqui.",
  "Qual foi o maior desafio de liderança que você enfrentou e como o resolveu?",
  "Como você define sua visão estratégica para os próximos 3-5 anos da organização?",
  "Descreva uma situação em que precisou tomar uma decisão difícil com informações incompletas. Como lidou?",
  "O que diferencia sua abordagem de liderança das demais? Qual é sua assinatura como líder?",
];

interface Props {
  colaboradorId: string;
  colaboradorNome?: string;
  colaboradorCargo?: string;
  onConcluido: () => void;
}

type Etapa = "iniciais" | "loading_perguntas" | "aprofundamento" | "loading_laudo" | "concluido";

export default function TesteCLevelForm({
  colaboradorId,
  colaboradorNome,
  colaboradorCargo,
  onConcluido,
}: Props) {
  const { criar, atualizar } = useTestesCLevel(colaboradorId);

  const [etapa, setEtapa] = useState<Etapa>("iniciais");
  const [respostasIniciais, setRespostasIniciais] = useState<string[]>(
    new Array(5).fill("")
  );
  const [perguntasAprof, setPerguntasAprof] = useState<string[]>([]);
  const [respostasAprof, setRespostasAprof] = useState<string[]>([]);
  const [laudo, setLaudo] = useState("");
  const [testeId, setTesteId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const handleEnviarIniciais = async () => {
    setEtapa("loading_perguntas");
    setErro(null);

    const respostas = PERGUNTAS_INICIAIS.map((p, i) => ({
      pergunta: p,
      resposta: respostasIniciais[i],
    }));

    try {
      // Save to DB
      const teste = await criar.mutateAsync({
        colaborador_id: colaboradorId,
        respostas_iniciais: respostas,
      });
      setTesteId(teste.id);

      // Call AI for follow-up questions
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch(
        `https://otsrpxfqqnqgicmfxzzm.supabase.co/functions/v1/clevel-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90c3JweGZxcW5xZ2ljbWZ4enptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NzYzOTYsImV4cCI6MjA4MTE1MjM5Nn0.1ujQirCm0xFvxnij3ZYdfnznMw3QsVuuywIZIDvUF8A",
          },
          body: JSON.stringify({ action: "perguntas", respostas }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erro ao gerar perguntas");
      }

      const data = await response.json();
      const perguntas = data.perguntas || [];
      setPerguntasAprof(perguntas);
      setRespostasAprof(new Array(perguntas.length).fill(""));

      // Update DB
      await atualizar.mutateAsync({
        id: teste.id,
        perguntas_aprofundamento: perguntas,
        status: "aguardando_aprofundamento",
      });

      setEtapa("aprofundamento");
    } catch (err: any) {
      setErro(err.message || "Erro inesperado");
      setEtapa("iniciais");
      toast.error(err.message || "Erro ao gerar perguntas de aprofundamento");
    }
  };

  const handleEnviarAprofundamento = async () => {
    if (!testeId) return;
    setEtapa("loading_laudo");
    setErro(null);

    const respostasAprofFormatadas = perguntasAprof.map((p, i) => ({
      pergunta: p,
      resposta: respostasAprof[i],
    }));

    const respostasIniciaisFormatadas = PERGUNTAS_INICIAIS.map((p, i) => ({
      pergunta: p,
      resposta: respostasIniciais[i],
    }));

    try {
      // Update DB with answers
      await atualizar.mutateAsync({
        id: testeId,
        respostas_aprofundamento: respostasAprofFormatadas,
      });

      // Call AI for report with streaming
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch(
        `https://otsrpxfqqnqgicmfxzzm.supabase.co/functions/v1/clevel-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90c3JweGZxcW5xZ2ljbWZ4enptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NzYzOTYsImV4cCI6MjA4MTE1MjM5Nn0.1ujQirCm0xFvxnij3ZYdfnznMw3QsVuuywIZIDvUF8A",
          },
          body: JSON.stringify({
            action: "laudo",
            respostas_iniciais: respostasIniciaisFormatadas,
            respostas_aprofundamento: respostasAprofFormatadas,
            colaborador_nome: colaboradorNome,
            colaborador_cargo: colaboradorCargo,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erro ao gerar laudo");
      }

      // Read SSE stream
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let laudoTexto = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                laudoTexto += parsed.content;
                setLaudo(laudoTexto);
              }
            } catch {
              // skip
            }
          }
        }
      }

      // Save final report
      await atualizar.mutateAsync({
        id: testeId,
        laudo: laudoTexto,
        status: "concluido",
      });

      setEtapa("concluido");
      toast.success("Laudo C-Level gerado com sucesso!");
    } catch (err: any) {
      setErro(err.message || "Erro inesperado");
      setEtapa("aprofundamento");
      toast.error(err.message || "Erro ao gerar laudo");
    }
  };

  if (etapa === "concluido") {
    return (
      <div className="space-y-4">
        <TesteCLevelResultado laudo={laudo} />
        <Button onClick={onConcluido}>Voltar ao histórico</Button>
      </div>
    );
  }

  if (etapa === "loading_perguntas") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            A IA está analisando suas respostas e gerando perguntas de
            aprofundamento...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (etapa === "loading_laudo") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gerando Laudo C-Level</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {laudo ? (
            <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
              {laudo}
              <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Gerando laudo completo...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (etapa === "aprofundamento") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Perguntas de Aprofundamento
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            A IA gerou perguntas complementares baseadas nas suas respostas
            iniciais.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {perguntasAprof.map((pergunta, i) => (
            <div key={i} className="space-y-2">
              <Label className="text-sm font-medium">
                {i + 1}. {pergunta}
              </Label>
              <Textarea
                value={respostasAprof[i] || ""}
                onChange={(e) => {
                  const nova = [...respostasAprof];
                  nova[i] = e.target.value;
                  setRespostasAprof(nova);
                }}
                placeholder="Sua resposta..."
                rows={3}
              />
            </div>
          ))}

          {erro && (
            <p className="text-sm text-destructive">{erro}</p>
          )}

          <Button
            onClick={handleEnviarAprofundamento}
            disabled={respostasAprof.some((r) => !r.trim())}
            className="w-full"
          >
            <Send className="mr-2 h-4 w-4" />
            Gerar Laudo Final
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Etapa: iniciais
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Avaliação C-Level</CardTitle>
        <p className="text-sm text-muted-foreground">
          Responda às 5 perguntas abaixo com detalhes. Suas respostas serão
          analisadas pela IA para gerar perguntas de aprofundamento.
        </p>
        <Progress value={0} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        {PERGUNTAS_INICIAIS.map((pergunta, i) => (
          <div key={i} className="space-y-2">
            <Label className="text-sm font-medium">
              {i + 1}. {pergunta}
            </Label>
            <Textarea
              value={respostasIniciais[i] || ""}
              onChange={(e) => {
                const nova = [...respostasIniciais];
                nova[i] = e.target.value;
                setRespostasIniciais(nova);
              }}
              placeholder="Sua resposta..."
              rows={3}
            />
          </div>
        ))}

        {erro && (
          <p className="text-sm text-destructive">{erro}</p>
        )}

        <Button
          onClick={handleEnviarIniciais}
          disabled={respostasIniciais.some((r) => !r.trim()) || criar.isPending}
          className="w-full"
        >
          {criar.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="mr-2 h-4 w-4" />
          )}
          Enviar e Gerar Perguntas de Aprofundamento
        </Button>
      </CardContent>
    </Card>
  );
}
