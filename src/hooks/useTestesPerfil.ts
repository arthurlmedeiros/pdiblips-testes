import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TestePerfil {
  id: string;
  colaborador_id: string | null;
  respostas: unknown[];
  resultado: Record<string, number>;
  perfil_dominante: string;
  created_at: string;
  user_id: string;
}

export function useTestesPerfil(colaboradorId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pdi_testes_perfil", colaboradorId ?? "own"],
    queryFn: async () => {
      let q = supabase
        .from("pdi_testes_perfil" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (colaboradorId) {
        q = q.eq("colaborador_id", colaboradorId);
      } else if (user?.id) {
        // Modo sem vínculo: busca registros do próprio usuário pelo user_id
        q = q.eq("user_id", user.id);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as TestePerfil[];
    },
    enabled: !!colaboradorId || !!user?.id,
  });

  const inserir = useMutation({
    mutationFn: async (payload: {
      colaborador_id: string | null;
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
