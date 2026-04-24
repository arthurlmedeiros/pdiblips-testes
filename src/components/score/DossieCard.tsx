import { useState } from "react";
import { Printer, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ScoreCard from "@/components/score/ScoreCard";
import ScoreDecompositionTable from "@/components/score/ScoreDecompositionTable";
import TesteAutoAvaliacaoResultado from "@/components/testes/TesteAutoAvaliacaoResultado";
import TestePerfilResultado from "@/components/testes/TestePerfilResultado";
import TesteCLevelResultado from "@/components/testes/TesteCLevelResultado";
import TesteBussolaResultado from "@/components/testes/TesteBussolaResultado";
import TestePercentilResultado from "@/components/testes/TestePercentilResultado";
import type { ScoreConsolidado } from "@/hooks/useScoreConsolidado";

interface Props {
  colaboradorId: string | null;
  latestScore: ScoreConsolidado;
  testes: {
    auto?: any;
    perfil?: any;
    clevel?: any;
    bussola?: any;
    maturidade?: any;
  };
}

export default function DossieCard({ latestScore, testes }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="print:shadow-none print:border-0">
        <CardHeader className="flex flex-row items-center justify-between print-hidden">
          <CardTitle className="text-base">Dossiê do Colaborador</CardTitle>
          <div className="flex gap-2">
            {open && (
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Imprimir PDF
              </Button>
            )}
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent forceMount className={open ? "" : "hidden print:block"}>
          <CardContent>
            <div className="dossie-content space-y-8 print:space-y-6">
              {testes.auto && (
                <section>
                  <h2 className="mb-4 text-lg font-bold border-b pb-2">
                    1. Dados Pessoais e Auto Avaliação
                  </h2>
                  {testes.auto.dados_pessoais && (
                    <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(testes.auto.dados_pessoais as Record<string, any>).map(
                        ([k, v]) => (
                          <div key={k}>
                            <span className="text-muted-foreground capitalize">
                              {k.replace(/_/g, " ")}:{" "}
                            </span>
                            <span className="font-medium">{String(v)}</span>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                  <TesteAutoAvaliacaoResultado teste={testes.auto} />
                </section>
              )}

              <section>
                <h2 className="mb-4 text-lg font-bold border-b pb-2">2. Score Consolidado</h2>
                <ScoreCard score={latestScore} />
                <div className="mt-4">
                  <ScoreDecompositionTable score={latestScore} />
                </div>
              </section>

              {testes.perfil && (
                <section>
                  <h2 className="mb-4 text-lg font-bold border-b pb-2">
                    3. Perfil Comportamental
                  </h2>
                  <TestePerfilResultado
                    resultado={testes.perfil.resultado}
                    perfilDominante={testes.perfil.perfil_dominante}
                    createdAt={testes.perfil.created_at}
                  />
                </section>
              )}

              {testes.bussola && (
                <section>
                  <h2 className="mb-4 text-lg font-bold border-b pb-2">
                    4. Bússola de Alta Performance
                  </h2>
                  <TesteBussolaResultado
                    pontuacoes={testes.bussola.pontuacoes}
                    pontuacaoTotal={testes.bussola.pontuacao_total}
                    respostas={testes.bussola.respostas}
                    createdAt={testes.bussola.created_at}
                  />
                </section>
              )}

              {testes.clevel && (
                <section>
                  <h2 className="mb-4 text-lg font-bold border-b pb-2">
                    5. Avaliação C-Level
                  </h2>
                  <TesteCLevelResultado
                    laudo={testes.clevel.laudo || "Laudo não disponível"}
                    createdAt={testes.clevel.created_at}
                    teste={testes.clevel}
                  />
                </section>
              )}

              {testes.maturidade && (
                <section>
                  <h2 className="mb-4 text-lg font-bold border-b pb-2">
                    6. Maturidade Executiva
                  </h2>
                  <TestePercentilResultado
                    pontuacoesFechadas={testes.maturidade.pontuacoes_fechadas ?? {}}
                    pontuacoesAbertas={testes.maturidade.pontuacoes_abertas ?? []}
                    scoreTotal={testes.maturidade.score_total ?? 0}
                    percentil={testes.maturidade.percentil ?? 0}
                    laudoIA={testes.maturidade.laudo_ia ?? ""}
                    nivel={testes.maturidade.nivel}
                    createdAt={testes.maturidade.created_at}
                  />
                </section>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
