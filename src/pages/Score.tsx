import { useEffect, useMemo, useRef, useState } from "react";
import { Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScoreCard from "@/components/score/ScoreCard";
import ScoreDecompositionTable from "@/components/score/ScoreDecompositionTable";
import ScoreMissingChecklist, { type ChecklistStatus } from "@/components/score/ScoreMissingChecklist";
import ScoreEvolutionChart from "@/components/score/ScoreEvolutionChart";
import PercentileRulerChart from "@/components/score/PercentileRulerChart";
import DossieCard from "@/components/score/DossieCard";
import { useTestesAutoAvaliacao } from "@/hooks/useTestesAutoAvaliacao";
import { useTestesPerfil } from "@/hooks/useTestesPerfil";
import { useTestesCLevel } from "@/hooks/useTestesCLevel";
import { useTestesBussola } from "@/hooks/useTestesBussola";
import { useTestesPercentil } from "@/hooks/useTestesPercentil";
import {
  useScoresPorColaborador,
  useTodosScores,
  useInserirScore,
  latestByColaborador,
} from "@/hooks/useScoreConsolidado";
import {
  calculateScore,
  deriveAderenciaFromCargo,
  getAderenciaScore,
  normalizeAutoScore,
  normalizeBussolaScore,
} from "@/utils/scoreCalculation";

interface ColaboradorWithCargo {
  id: string;
  nome: string;
  user_id: string | null;
  cargo_id: string | null;
  salario: number | null;
  cargo_rel: { id: string; nome: string; tipo: string; nivel: string } | null;
}

export default function Score() {
  const { user, hasRole } = useAuth();
  const isAdminGeral = hasRole("admin_geral");
  const isAdminCeo = hasRole("admin_ceo");
  const isAdmin = isAdminGeral || isAdminCeo;
  const isDiretor = hasRole("admin_diretor");
  const canSelect = isAdmin || isDiretor;
  const canSeeRuler = isAdminGeral || isAdminCeo;

  const { data: colaboradores = [] } = useQuery({
    queryKey: ["pdi_colaboradores", "score_selector"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdi_colaboradores")
        .select(
          "id, nome, user_id, cargo_id, salario, cargo_rel:pdi_cargos(id, nome, tipo, nivel)" as any,
        )
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data as unknown as ColaboradorWithCargo[];
    },
    enabled: canSelect,
  });

  const [selectedColabId, setSelectedColabId] = useState<string | null>(null);

  // Auto-selecionar próprio colaborador para gerente
  const ownColabId = useMemo(
    () => colaboradores.find((c) => c.user_id === user?.id)?.id ?? null,
    [colaboradores, user?.id],
  );
  const colabId = canSelect ? selectedColabId : ownColabId;
  const colab = colaboradores.find((c) => c.id === colabId);

  const { data: autoList = [] } = useTestesAutoAvaliacao(colabId ?? undefined);
  const { data: perfilList = [] } = useTestesPerfil(colabId ?? undefined);
  const { data: clevelList = [] } = useTestesCLevel(colabId ?? undefined);
  const { data: bussolaList = [] } = useTestesBussola(colabId ?? undefined);
  const { data: percentilList = [] } = useTestesPercentil(colabId ?? undefined);

  const testes = {
    auto: autoList[0],
    perfil: perfilList[0],
    clevel: clevelList[0],
    bussola: bussolaList[0],
    maturidade: percentilList[0],
  };

  const { data: scores = [], isLoading: loadingScores } = useScoresPorColaborador(
    colabId,
    user?.id,
  );
  const latestScore = scores[0] ?? null;
  const { mutate: inserirScore, isPending: inserindoScore } = useInserirScore();
  const { data: todosScores = [] } = useTodosScores();
  const latest = Object.values(latestByColaborador(todosScores));

  // ── AUTO-COMPUTE ──
  const lastComputedKey = useRef<string | null>(null);
  useEffect(() => {
    if (!colabId || inserindoScore) return;
    if (!colab?.cargo_rel) return;
    const aderencia = deriveAderenciaFromCargo(colab.cargo_rel.tipo, colab.cargo_rel.nivel);
    if (!aderencia) return;
    if (!testes.auto || !testes.perfil || !testes.clevel || !testes.bussola || !testes.maturidade) return;
    if (testes.clevel.status !== "concluido" || testes.clevel.score_numerico === null) return;

    const key = [
      testes.auto.id,
      testes.perfil.id,
      testes.clevel.id,
      testes.bussola.id,
      testes.maturidade.id,
      testes.clevel.score_numerico,
      colab.cargo_id,
      aderencia.cargo_alvo,
      aderencia.nivel_cargo,
    ].join("|");

    const sameAsLatest =
      latestScore &&
      latestScore.auto_avaliacao_id === testes.auto.id &&
      latestScore.perfil_id === testes.perfil.id &&
      latestScore.clevel_id === testes.clevel.id &&
      latestScore.bussola_id === testes.bussola.id &&
      latestScore.maturidade_id === testes.maturidade.id &&
      Number(latestScore.score_clevel) === Number(testes.clevel.score_numerico) &&
      latestScore.cargo_id === colab.cargo_id;
    if (sameAsLatest || lastComputedKey.current === key) return;
    lastComputedKey.current = key;

    const scoreAuto = normalizeAutoScore(Number((testes.auto as any).pontuacao_total));
    const scorePerfilAderencia = getAderenciaScore(
      aderencia.cargo_alvo,
      aderencia.nivel_cargo,
      (testes.perfil as any).perfil_dominante,
    );
    const scoreClevel = Number(testes.clevel.score_numerico);
    const scoreBussola = normalizeBussolaScore(Number((testes.bussola as any).pontuacao_total));
    const scoreMaturidade = Number((testes.maturidade as any).percentil);

    const result = calculateScore({
      scoreAuto,
      scorePerfilAderencia,
      scoreClevel,
      scoreBussola,
      scoreMaturidade,
    });

    inserirScore({
      colaborador_id: colabId,
      cargo_id: colab.cargo_id,
      cargo_alvo: aderencia.cargo_alvo,
      nivel_cargo: aderencia.nivel_cargo,
      arquetipo: (testes.perfil as any).perfil_dominante,
      score_auto: scoreAuto,
      score_perfil_aderencia: scorePerfilAderencia,
      score_clevel: scoreClevel,
      score_bussola: scoreBussola,
      score_maturidade: scoreMaturidade,
      auto_avaliacao_id: testes.auto.id,
      perfil_id: testes.perfil.id,
      clevel_id: testes.clevel.id,
      bussola_id: testes.bussola.id,
      maturidade_id: testes.maturidade.id,
      score_raw: result.scoreRaw,
      score_display: result.scoreDisplay,
      banda: result.banda,
    });
  }, [
    colabId,
    colab?.cargo_id,
    colab?.cargo_rel?.tipo,
    colab?.cargo_rel?.nivel,
    testes.auto?.id,
    testes.perfil?.id,
    testes.clevel?.id,
    testes.clevel?.status,
    testes.clevel?.score_numerico,
    testes.bussola?.id,
    testes.maturidade?.id,
    latestScore?.id,
    inserindoScore,
    inserirScore,
  ]);

  const checklist: ChecklistStatus = {
    cargo: !!colab?.cargo_rel,
    auto: !!testes.auto,
    perfil: !!testes.perfil,
    clevel: testes.clevel?.status === "concluido",
    clevelScore:
      testes.clevel?.score_numerico !== null && testes.clevel?.score_numerico !== undefined,
    bussola: !!testes.bussola,
    maturidade: !!testes.maturidade,
  };
  const tudoPronto = Object.values(checklist).every(Boolean);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Score Consolidado</h1>
        </div>
        {canSelect && (
          <Select
            value={selectedColabId ?? ""}
            onValueChange={(v) => setSelectedColabId(v || null)}
          >
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Selecionar colaborador…" />
            </SelectTrigger>
            <SelectContent>
              {colaboradores.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome} — {c.cargo_rel?.nome ?? "Sem cargo"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Tabs defaultValue="individual">
        <TabsList>
          <TabsTrigger value="individual">Score Individual</TabsTrigger>
          {canSelect && <TabsTrigger value="equipe">Equipe / Empresa</TabsTrigger>}
        </TabsList>

        <TabsContent value="individual" className="space-y-6 pt-4">
          {!colabId ? (
            <p className="text-sm text-muted-foreground">
              Selecione um colaborador para visualizar o score.
            </p>
          ) : loadingScores ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <>
              {latestScore && tudoPronto && <ScoreCard score={latestScore} />}
              {latestScore && tudoPronto && <ScoreDecompositionTable score={latestScore} />}
              {!tudoPronto && <ScoreMissingChecklist status={checklist} />}
              {tudoPronto && inserindoScore && !latestScore && (
                <p className="text-sm text-muted-foreground">Calculando score consolidado…</p>
              )}
              {scores.length >= 2 && <ScoreEvolutionChart scores={scores} />}
              {latestScore && tudoPronto && (
                <DossieCard colaboradorId={colabId} latestScore={latestScore} testes={testes} />
              )}
            </>
          )}
        </TabsContent>

        {canSelect && (
          <TabsContent value="equipe" className="space-y-6 pt-4">
            {canSeeRuler && (
              <PercentileRulerChart
                latestScores={latest}
                titulo="Distribuição Percentil — Empresa"
              />
            )}
            {!canSeeRuler && isDiretor && latest.length > 0 && (
              <div className="rounded-md bg-muted/30 p-4 text-sm">
                <strong>Score médio da equipe:</strong>{" "}
                {Math.round(latest.reduce((a, b) => a + b.score_display, 0) / latest.length)}
              </div>
            )}
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left">Colaborador</th>
                    <th className="px-4 py-2 text-right">Score</th>
                    <th className="px-4 py-2 text-right">Banda</th>
                    <th className="px-4 py-2 text-right">Calculado em</th>
                  </tr>
                </thead>
                <tbody>
                  {latest.map((s) => {
                    const c = colaboradores.find((x) => x.id === s.colaborador_id);
                    return (
                      <tr
                        key={s.id}
                        className="cursor-pointer border-b hover:bg-muted/30"
                        onClick={() =>
                          s.colaborador_id && setSelectedColabId(s.colaborador_id)
                        }
                      >
                        <td className="px-4 py-2">{c?.nome ?? "—"}</td>
                        <td className="px-4 py-2 text-right font-bold">{s.score_display}</td>
                        <td className="px-4 py-2 text-right">{s.banda}</td>
                        <td className="px-4 py-2 text-right">
                          {new Date(s.created_at).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
