import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TesteAutoAvaliacao {
  id: string;
  colaborador_id: string | null;
  user_id: string;
  dados_pessoais: {
    formacao: string;
    especializacao: string;
    idade: number;
    experiencia_cargo: number;
    residencia: string;
  };
  pontuacoes: {
    fluencia_ingles: number;
    uso_tecnologia: number;
    comunicacao_clara: number;
    gestao_conflitos: number;
    decisao_pressao: number;
    organizacao_disciplina: number;
    responsabilidade_ownership: number;
  };
  pontuacao_total: number;
  created_at: string;
}

export function useTestesAutoAvaliacao(colaboradorId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pdi_testes_auto_avaliacao", colaboradorId ?? "own"],
    queryFn: async () => {
      let q = supabase
        .from("pdi_testes_auto_avaliacao" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (colaboradorId) {
        q = q.eq("colaborador_id", colaboradorId);
      } else if (user?.id) {
        q = q.eq("user_id", user.id);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as TesteAutoAvaliacao[];
    },
    enabled: !!colaboradorId || !!user?.id,
  });

  const inserir = useMutation({
    mutationFn: async (payload: {
      colaborador_id: string | null;
      dados_pessoais: TesteAutoAvaliacao["dados_pessoais"];
      pontuacoes: TesteAutoAvaliacao["pontuacoes"];
      pontuacao_total: number;
    }) => {
      const { data, error } = await supabase
        .from("pdi_testes_auto_avaliacao" as any)
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as TesteAutoAvaliacao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdi_testes_auto_avaliacao"] });
    },
  });

  return { ...query, inserir };
}
