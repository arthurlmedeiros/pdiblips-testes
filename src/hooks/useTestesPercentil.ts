import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TestePercentil {
  id: string;
  colaborador_id: string | null;
  user_id: string;
  nivel: string;
  respostas_fechadas: Record<string, any>;
  respostas_abertas: Record<string, any>;
  pontuacoes_fechadas: Record<string, number> | null;
  pontuacoes_abertas: any[] | null;
  score_total: number | null;
  percentil: number | null;
  laudo_ia: string | null;
  status: string;
  created_at: string;
}

export function useTestesPercentil(colaboradorId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pdi_testes_percentil", colaboradorId ?? "own"],
    queryFn: async () => {
      let q = supabase
        .from("pdi_testes_percentil" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (colaboradorId) {
        q = q.eq("colaborador_id", colaboradorId);
      } else if (user?.id) {
        q = q.eq("user_id", user.id);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as TestePercentil[];
    },
    enabled: !!colaboradorId || !!user?.id,
  });

  const inserir = useMutation({
    mutationFn: async (payload: {
      colaborador_id: string | null;
      nivel: string;
      respostas_fechadas: Record<string, any>;
      respostas_abertas: Record<string, any>;
      pontuacoes_fechadas?: Record<string, number>;
      status?: string;
    }) => {
      const { data, error } = await supabase
        .from("pdi_testes_percentil" as any)
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as TestePercentil;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdi_testes_percentil"] });
    },
  });

  const atualizar = useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      pontuacoes_abertas?: any[];
      score_total?: number;
      percentil?: number;
      laudo_ia?: string;
      status?: string;
    }) => {
      const { data, error } = await supabase
        .from("pdi_testes_percentil" as any)
        .update(payload as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as TestePercentil;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdi_testes_percentil"] });
    },
  });

  return { ...query, inserir, atualizar };
}
