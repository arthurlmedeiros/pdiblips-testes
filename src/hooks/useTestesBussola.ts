import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@core/integrations/supabase/client";

export interface TesteBussola {
  id: string;
  colaborador_id: string;
  respostas: Record<string, string>;
  pontuacoes: Record<string, number>;
  pontuacao_total: number;
  created_at: string;
  user_id: string;
}

export function useTestesBussola(colaboradorId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pdi_testes_bussola", colaboradorId],
    queryFn: async () => {
      let q = supabase
        .from("pdi_testes_bussola" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (colaboradorId) {
        q = q.eq("colaborador_id", colaboradorId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as TesteBussola[];
    },
    enabled: !!colaboradorId,
  });

  const inserir = useMutation({
    mutationFn: async (payload: {
      colaborador_id: string;
      respostas: Record<string, string>;
      pontuacoes: Record<string, number>;
      pontuacao_total: number;
    }) => {
      const { data, error } = await supabase
        .from("pdi_testes_bussola" as any)
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as TesteBussola;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdi_testes_bussola"] });
    },
  });

  return { ...query, inserir };
}
