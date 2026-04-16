import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Users } from "lucide-react";
import type { ColaboradorWithRelations } from "@/hooks/useColaboradores";
import TestePerfilResultado, { PERFIL_ANIMAL_NAME } from "./TestePerfilResultado";
import TesteCLevelResultado from "./TesteCLevelResultado";
import TesteBussolaResultado from "./TesteBussolaResultado";
import TestePercentilResultado from "./TestePercentilResultado";

interface TesteEquipeSectionProps {
  colaboradores: ColaboradorWithRelations[];
}

type DetalheType = {
  type: "perfil" | "clevel" | "bussola" | "percentil";
  data: any;
  nome: string;
} | null;

export default function TesteEquipeSection({ colaboradores }: TesteEquipeSectionProps) {
  const [detalhe, setDetalhe] = useState<DetalheType>(null);

  const { data: todosPerfil = [] } = useQuery({
    queryKey: ["equipe_testes", "perfil"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdi_testes_perfil")
        .select("id, colaborador_id, perfil_dominante, resultado, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: colaboradores.length > 0,
  });

  const { data: todosCLevel = [] } = useQuery({
    queryKey: ["equipe_testes", "clevel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdi_testes_clevel")
        .select("id, colaborador_id, laudo, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: colaboradores.length > 0,
  });

  const { data: todosBussola = [] } = useQuery({
    queryKey: ["equipe_testes", "bussola"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdi_testes_bussola")
        .select("id, colaborador_id, pontuacao_total, pontuacoes, respostas, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: colaboradores.length > 0,
  });

  const { data: todosPercentil = [] } = useQuery({
    queryKey: ["equipe_testes", "percentil"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdi_testes_percentil")
        .select("id, colaborador_id, percentil, laudo_ia, nivel, score_total, status, pontuacoes_fechadas, pontuacoes_abertas, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: colaboradores.length > 0,
  });

  // Agrupar por colaborador_id (já ordenado desc, pega o mais recente)
  const mapaEquipe = colaboradores.reduce(
    (acc, colab) => {
      acc[colab.id] = {
        perfil: todosPerfil.find((t) => t.colaborador_id === colab.id) ?? null,
        clevel: todosCLevel.find((t) => t.colaborador_id === colab.id) ?? null,
        bussola: todosBussola.find((t) => t.colaborador_id === colab.id) ?? null,
        percentil: todosPercentil.find((t) => t.colaborador_id === colab.id) ?? null,
      };
      return acc;
    },
    {} as Record<string, { perfil: any; clevel: any; bussola: any; percentil: any }>
  );

  if (colaboradores.length === 0) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Minha Equipe
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-b-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Perfil Comportamental</TableHead>
                  <TableHead>Avaliação C-Level</TableHead>
                  <TableHead>Bússola Alta Performance</TableHead>
                  <TableHead>Maturidade Executiva</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colaboradores.map((colab) => {
                  const m = mapaEquipe[colab.id];
                  return (
                    <TableRow key={colab.id}>
                      <TableCell className="font-medium">{colab.nome}</TableCell>

                      {/* Perfil */}
                      <TableCell>
                        {m?.perfil ? (
                          <Badge
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => setDetalhe({ type: "perfil", data: m.perfil, nome: colab.nome })}
                          >
                            {PERFIL_ANIMAL_NAME[m.perfil.perfil_dominante] || m.perfil.perfil_dominante}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>

                      {/* C-Level */}
                      <TableCell>
                        {m?.clevel ? (
                          <Badge
                            variant={m.clevel.status === "concluido" ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => setDetalhe({ type: "clevel", data: m.clevel, nome: colab.nome })}
                          >
                            {m.clevel.status === "concluido" ? "Concluído" : "Em andamento"}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>

                      {/* Bússola */}
                      <TableCell>
                        {m?.bussola ? (
                          <Badge
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => setDetalhe({ type: "bussola", data: m.bussola, nome: colab.nome })}
                          >
                            {m.bussola.pontuacao_total}/76
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>

                      {/* Percentil */}
                      <TableCell>
                        {m?.percentil ? (
                          <Badge
                            variant={m.percentil.status === "concluido" ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => setDetalhe({ type: "percentil", data: m.percentil, nome: colab.nome })}
                          >
                            {m.percentil.status === "concluido"
                              ? `${m.percentil.percentil}%`
                              : "Em andamento"}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!detalhe} onOpenChange={() => setDetalhe(null)}>
        <SheetContent className="w-[620px] sm:max-w-[620px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {detalhe?.nome} —{" "}
              {detalhe?.type === "perfil" && "Perfil Comportamental"}
              {detalhe?.type === "clevel" && "Avaliação C-Level"}
              {detalhe?.type === "bussola" && "Bússola Alta Performance"}
              {detalhe?.type === "percentil" && "Maturidade Executiva"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {detalhe?.type === "perfil" && (
              <TestePerfilResultado
                resultado={detalhe.data.resultado}
                perfilDominante={detalhe.data.perfil_dominante}
                createdAt={detalhe.data.created_at}
              />
            )}
            {detalhe?.type === "clevel" && (
              <TesteCLevelResultado
                laudo={detalhe.data.laudo || "Laudo não disponível"}
                createdAt={detalhe.data.created_at}
              />
            )}
            {detalhe?.type === "bussola" && (
              <TesteBussolaResultado
                pontuacoes={detalhe.data.pontuacoes}
                pontuacaoTotal={detalhe.data.pontuacao_total}
                respostas={detalhe.data.respostas}
                createdAt={detalhe.data.created_at}
              />
            )}
            {detalhe?.type === "percentil" && detalhe.data.status === "concluido" && (
              <TestePercentilResultado
                pontuacoesFechadas={detalhe.data.pontuacoes_fechadas}
                pontuacoesAbertas={detalhe.data.pontuacoes_abertas}
                scoreTotal={detalhe.data.score_total}
                percentil={detalhe.data.percentil}
                laudoIA={detalhe.data.laudo_ia}
                nivel={detalhe.data.nivel}
                createdAt={detalhe.data.created_at}
              />
            )}
            {detalhe?.type === "percentil" && detalhe.data.status !== "concluido" && (
              <p className="text-muted-foreground text-sm">Avaliação em andamento — aguardando processamento da IA.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
