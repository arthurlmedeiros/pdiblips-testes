import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@core/integrations/supabase/client";

export interface TestePerfil {
  id: string;
  colaborador_id: string;
  respostas: unknown[];
  resultado: Record<string, number>;
  perfil_dominante: string;
  created_at: string;
  user_id: string;
}

export function useTestesPerfil(colaboradorId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pdi_testes_perfil", colaboradorId],
    queryFn: async () => {
      let q = supabase
        .from("pdi_testes_perfil" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (colaboradorId) {
        q = q.eq("colaborador_id", colaboradorId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as TestePerfil[];
    },
    enabled: !!colaboradorId,
  });

  const inserir = useMutation({
    mutationFn: async (payload: {
      colaborador_id: string;
      respostas: unknown[];
      resultado: Record<string, number>;
      perfil_dominante: string;
    }) => {
      const { data, error } = await supabase
        .from("pdi_testes_perfil" as any)
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as TestePerfil;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdi_testes_perfil"] });
    },
  });

  return { ...query, inserir };
}
