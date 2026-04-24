import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TesteCLevel {
  id: string;
  colaborador_id: string | null;
  respostas_iniciais: { pergunta: string; resposta: string }[] | null;
  perguntas_aprofundamento: string[] | null;
  respostas_aprofundamento: { pergunta: string; resposta: string }[] | null;
  laudo: string | null;
  status: string;
  score_numerico: number | null;
  created_at: string;
  user_id: string;
}

export function useTestesCLevel(colaboradorId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pdi_testes_clevel", colaboradorId ?? "own"],
    queryFn: async () => {
      let q = supabase
        .from("pdi_testes_clevel" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (colaboradorId) {
        q = q.eq("colaborador_id", colaboradorId);
      } else if (user?.id) {
        q = q.eq("user_id", user.id);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as TesteCLevel[];
    },
    enabled: !!colaboradorId || !!user?.id,
  });

  const criar = useMutation({
    mutationFn: async (payload: { colaborador_id: string | null; respostas_iniciais: unknown }) => {
      const { data, error } = await supabase
        .from("pdi_testes_clevel" as any)
        .insert({ ...payload, status: "aguardando_aprofundamento" } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as TesteCLevel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdi_testes_clevel"] });
    },
  });

  const atualizar = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase
        .from("pdi_testes_clevel" as any)
        .update(payload as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as TesteCLevel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdi_testes_clevel"] });
    },
  });

  const gerarScoreIA = useMutation({
    mutationFn: async (p: {
      testeId: string;
      respostas_iniciais: { pergunta: string; resposta: string }[];
      respostas_aprofundamento: { pergunta: string; resposta: string }[];
      laudo: string;
      colaborador_cargo?: string;
    }) => {
      const { data: fn, error: fnErr } = await supabase.functions.invoke("clevel-ai", {
        body: {
          action: "score",
          respostas_iniciais: p.respostas_iniciais,
          respostas_aprofundamento: p.respostas_aprofundamento,
          laudo: p.laudo,
          colaborador_cargo: p.colaborador_cargo,
        },
      });
      if (fnErr) throw fnErr;
      const score_numerico = (fn as any)?.score_numerico as number;
      if (typeof score_numerico !== "number") {
        throw new Error("Edge Function não retornou score_numerico");
      }
      const { error } = await supabase
        .from("pdi_testes_clevel" as any)
        .update({ score_numerico } as any)
        .eq("id", p.testeId);
      if (error) throw error;
      return score_numerico;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdi_testes_clevel"] });
      queryClient.invalidateQueries({ queryKey: ["pdi_score_consolidado"] });
    },
  });

  return { ...query, criar, atualizar, gerarScoreIA };
}
