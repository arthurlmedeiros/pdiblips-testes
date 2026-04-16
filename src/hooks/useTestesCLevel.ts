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

  return { ...query, criar, atualizar };
}
