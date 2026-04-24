import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ScoreConsolidado {
  id: string;
  user_id: string;
  colaborador_id: string | null;
  cargo_id: string | null;
  cargo_alvo: string;
  nivel_cargo: string;
  arquetipo: string;
  score_auto: number;
  score_perfil_aderencia: number;
  score_clevel: number;
  score_bussola: number;
  score_maturidade: number;
  auto_avaliacao_id: string | null;
  perfil_id: string | null;
  clevel_id: string | null;
  bussola_id: string | null;
  maturidade_id: string | null;
  score_raw: number;
  score_display: number;
  banda: "Percentil 25°" | "Percentil 50°" | "Percentil 75°";
  created_at: string;
}

export type InsertScorePayload = Omit<ScoreConsolidado, "id" | "user_id" | "created_at">;

export function useScoresPorColaborador(
  colaboradorId?: string | null,
  userIdFallback?: string,
) {
  return useQuery({
    queryKey: ["pdi_score_consolidado", colaboradorId ?? userIdFallback ?? "none"],
    queryFn: async () => {
      let q = supabase
        .from("pdi_score_consolidado" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (colaboradorId) q = q.eq("colaborador_id", colaboradorId);
      else if (userIdFallback) q = q.eq("user_id", userIdFallback).is("colaborador_id", null);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as ScoreConsolidado[];
    },
    enabled: !!colaboradorId || !!userIdFallback,
  });
}

export function useTodosScores() {
  return useQuery({
    queryKey: ["pdi_score_consolidado", "todos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdi_score_consolidado" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ScoreConsolidado[];
    },
  });
}

export function useInserirScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: InsertScorePayload) => {
      const { data, error } = await supabase
        .from("pdi_score_consolidado" as any)
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ScoreConsolidado;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdi_score_consolidado"] }),
  });
}

/** Dedupe: último score por colaborador_id (ou user_id quando colaborador_id for null). */
export function latestByColaborador(
  scores: ScoreConsolidado[],
): Record<string, ScoreConsolidado> {
  return scores.reduce(
    (acc, s) => {
      const key = s.colaborador_id ?? s.user_id;
      if (!acc[key] || new Date(s.created_at) > new Date(acc[key].created_at))
        acc[key] = s;
      return acc;
    },
    {} as Record<string, ScoreConsolidado>,
  );
}
