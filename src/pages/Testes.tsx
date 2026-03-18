import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Brain, Award, Compass, BarChart3, Loader2 } from "lucide-react";
import { useTestesPerfil, type TestePerfil } from "@testes/hooks/useTestesPerfil";
import { useTestesCLevel, type TesteCLevel } from "@testes/hooks/useTestesCLevel";
import { useTestesBussola, type TesteBussola } from "@testes/hooks/useTestesBussola";
import { useTestesPercentil, type TestePercentil } from "@testes/hooks/useTestesPercentil";
import { useColaboradores } from "@organograma/hooks/useColaboradores";
import { useAuth } from "@core/contexts/AuthContext";
import TestePerfilForm from "@testes/components/testes/TestePerfilForm";
import TestePerfilResultado, { PERFIL_ANIMAL_NAME } from "@testes/components/testes/TestePerfilResultado";
import TesteCLevelForm from "@testes/components/testes/TesteCLevelForm";
import TesteCLevelResultado from "@testes/components/testes/TesteCLevelResultado";
import TesteBussolaForm from "@testes/components/testes/TesteBussolaForm";
import TesteBussolaResultado from "@testes/components/testes/TesteBussolaResultado";
import TestePercentilForm from "@testes/components/testes/TestePercentilForm";
import TestePercentilResultado from "@testes/components/testes/TestePercentilResultado";

const Testes = () => {
  const { data: colaboradores, isLoading: loadingColabs } = useColaboradores();
  const { roles, hasRole, user } = useAuth();
  const [colaboradorId, setColaboradorId] = useState<string>("");

  // Auto-selecionar colaborador vinculado ao usuário logado
  useEffect(() => {
    if (colaboradores && user && !colaboradorId) {
      const meuColaborador = colaboradores.find(c => c.user_id === user.id);
      if (meuColaborador) {
        setColaboradorId(meuColaborador.id);
      }
    }
  }, [colaboradores, user]);
  const [novoTestePerfil, setNovoTestePerfil] = useState(false);
  const [novoTesteCLevel, setNovoTesteCLevel] = useState(false);
  const [novoTesteBussola, setNovoTesteBussola] = useState(false);
  const [novoTestePercentil, setNovoTestePercentil] = useState(false);
  const [percentilNivel, setPercentilNivel] = useState<"gerencial" | "diretoria">("gerencial");
  const [verPerfil, setVerPerfil] = useState<TestePerfil | null>(null);
  const [verCLevel, setVerCLevel] = useState<TesteCLevel | null>(null);
  const [verBussola, setVerBussola] = useState<TesteBussola | null>(null);
  const [verPercentil, setVerPercentil] = useState<TestePercentil | null>(null);

  const { data: testesPerfil, isLoading: loadingPerfil } = useTestesPerfil(colaboradorId);
  const { data: testesCLevel, isLoading: loadingCLevel } = useTestesCLevel(colaboradorId);
  const { data: testesBussola, isLoading: loadingBussola } = useTestesBussola(colaboradorId);
  const { data: testesPercentil, isLoading: loadingPercentil } = useTestesPercentil(colaboradorId);

  const colaboradorSelecionado = colaboradores?.find((c) => c.id === colaboradorId);

  const isAdmin = hasRole("admin_geral");
  const isDiretor = hasRole("admin_diretor");
  const isCeo = hasRole("admin_ceo");

  const resetStates = () => {
    setNovoTestePerfil(false);
    setNovoTesteCLevel(false);
    setNovoTesteBussola(false);
    setNovoTestePercentil(false);
    setVerPerfil(null);
    setVerCLevel(null);
    setVerBussola(null);
    setVerPercentil(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">
          Testes & Avaliações
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Avaliações de perfil comportamental, performance C-Level, Bússola da Alta Performance e Maturidade Executiva
        </p>
      </div>

      {/* Seletor de colaborador */}
      <div className="max-w-sm">
        <Select value={colaboradorId} onValueChange={(v) => { setColaboradorId(v); resetStates(); }}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um colaborador" />
          </SelectTrigger>
          <SelectContent>
            {loadingColabs ? (
              <SelectItem value="_loading" disabled>Carregando...</SelectItem>
            ) : (
              colaboradores?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome} {c.cargo ? `- ${c.cargo}` : ""}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {!colaboradorId && !loadingColabs && colaboradores && colaboradores.length > 0 && !colaboradores.find(c => c.user_id === user?.id) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <p className="font-medium text-foreground">Usuário não vinculado</p>
            <p className="text-sm">Seu usuário não está vinculado a um colaborador no organograma. Solicite ao administrador para fazer a vinculação.</p>
          </CardContent>
        </Card>
      ) : !colaboradorId ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
            {loadingColabs ? "Carregando..." : "Selecione um colaborador para visualizar ou iniciar testes"}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="perfil">
          <TabsList className="flex-wrap">
            <TabsTrigger value="perfil">
              <Brain className="mr-2 h-4 w-4" /> Perfil Comportamental
            </TabsTrigger>
            <TabsTrigger value="clevel">
              <Award className="mr-2 h-4 w-4" /> Avaliação C-Level
            </TabsTrigger>
            <TabsTrigger value="bussola">
              <Compass className="mr-2 h-4 w-4" /> Bússola Alta Performance
            </TabsTrigger>
            <TabsTrigger value="percentil">
              <BarChart3 className="mr-2 h-4 w-4" /> Maturidade Executiva
            </TabsTrigger>
          </TabsList>

          {/* TAB: Perfil Comportamental */}
          <TabsContent value="perfil" className="space-y-4">
            {novoTestePerfil ? (
              <TestePerfilForm colaboradorId={colaboradorId} onConcluido={() => setNovoTestePerfil(false)} />
            ) : verPerfil ? (
              <div className="space-y-4">
                <TestePerfilResultado resultado={verPerfil.resultado} perfilDominante={verPerfil.perfil_dominante} createdAt={verPerfil.created_at} />
                <Button variant="outline" onClick={() => setVerPerfil(null)}>Voltar ao histórico</Button>
              </div>
            ) : (
              <>
                <Button onClick={() => setNovoTestePerfil(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Iniciar Teste de Perfil
                </Button>
                {loadingPerfil ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : testesPerfil && testesPerfil.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Histórico</h3>
                    {testesPerfil.map((t) => (
                      <Card key={t.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setVerPerfil(t)}>
                        <CardContent className="flex items-center justify-between py-3 px-4">
                          <div>
                            <p className="text-sm font-medium">Teste de Perfil Comportamental</p>
                            <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</p>
                          </div>
                          <Badge variant="secondary">{PERFIL_ANIMAL_NAME[t.perfil_dominante] || t.perfil_dominante}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum teste realizado ainda.</p>
                )}
              </>
            )}
          </TabsContent>

          {/* TAB: C-Level */}
          <TabsContent value="clevel" className="space-y-4">
            {novoTesteCLevel ? (
              <TesteCLevelForm
                colaboradorId={colaboradorId}
                colaboradorNome={colaboradorSelecionado?.nome}
                colaboradorCargo={colaboradorSelecionado?.cargo || undefined}
                onConcluido={() => setNovoTesteCLevel(false)}
              />
            ) : verCLevel ? (
              <div className="space-y-4">
                <TesteCLevelResultado laudo={verCLevel.laudo || "Laudo não disponível"} createdAt={verCLevel.created_at} />
                <Button variant="outline" onClick={() => setVerCLevel(null)}>Voltar ao histórico</Button>
              </div>
            ) : (
              <>
                <Button onClick={() => setNovoTesteCLevel(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Iniciar Avaliação C-Level
                </Button>
                {loadingCLevel ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : testesCLevel && testesCLevel.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Histórico</h3>
                    {testesCLevel.map((t) => (
                      <Card key={t.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setVerCLevel(t)}>
                        <CardContent className="flex items-center justify-between py-3 px-4">
                          <div>
                            <p className="text-sm font-medium">Avaliação C-Level</p>
                            <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</p>
                          </div>
                          <Badge variant={t.status === "concluido" ? "default" : "secondary"}>
                            {t.status === "concluido" ? "Concluído" : t.status === "aguardando_aprofundamento" ? "Em andamento" : "Iniciado"}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma avaliação realizada ainda.</p>
                )}
              </>
            )}
          </TabsContent>

          {/* TAB: Bússola Alta Performance */}
          <TabsContent value="bussola" className="space-y-4">
            {novoTesteBussola ? (
              <TesteBussolaForm colaboradorId={colaboradorId} onConcluido={() => setNovoTesteBussola(false)} />
            ) : verBussola ? (
              <div className="space-y-4">
                <TesteBussolaResultado
                  pontuacoes={verBussola.pontuacoes}
                  pontuacaoTotal={verBussola.pontuacao_total}
                  respostas={verBussola.respostas}
                  createdAt={verBussola.created_at}
                />
                <Button variant="outline" onClick={() => setVerBussola(null)}>Voltar ao histórico</Button>
              </div>
            ) : (
              <>
                <Button onClick={() => setNovoTesteBussola(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Iniciar Bússola da Alta Performance
                </Button>
                {loadingBussola ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : testesBussola && testesBussola.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Histórico</h3>
                    {testesBussola.map((t) => (
                      <Card key={t.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setVerBussola(t)}>
                        <CardContent className="flex items-center justify-between py-3 px-4">
                          <div>
                            <p className="text-sm font-medium">Bússola da Alta Performance</p>
                            <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</p>
                          </div>
                          <Badge variant="secondary">{t.pontuacao_total}/76</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma avaliação realizada ainda.</p>
                )}
              </>
            )}
          </TabsContent>

          {/* TAB: Maturidade Executiva (Percentil) */}
          <TabsContent value="percentil" className="space-y-4">
            {novoTestePercentil ? (
              <TestePercentilForm
                colaboradorId={colaboradorId}
                nivel={percentilNivel}
                onConcluido={() => setNovoTestePercentil(false)}
              />
            ) : verPercentil ? (
              <div className="space-y-4">
                <TestePercentilResultado
                  pontuacoesFechadas={verPercentil.pontuacoes_fechadas as Record<string, number> || {}}
                  pontuacoesAbertas={verPercentil.pontuacoes_abertas as any[] || []}
                  scoreTotal={verPercentil.score_total || 0}
                  percentil={verPercentil.percentil || 0}
                  laudoIA={verPercentil.laudo_ia || ""}
                  nivel={verPercentil.nivel}
                  createdAt={verPercentil.created_at}
                />
                <Button variant="outline" onClick={() => setVerPercentil(null)}>Voltar ao histórico</Button>
              </div>
            ) : (
              <>
                {/* Botões de iniciar com lógica de role */}
                <div className="flex items-center gap-3 flex-wrap">
                  {isAdmin ? (
                    <>
                      <Select value={percentilNivel} onValueChange={(v) => setPercentilNivel(v as "gerencial" | "diretoria")}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gerencial">Nível Gerencial</SelectItem>
                          <SelectItem value="diretoria">Nível Diretoria</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={() => setNovoTestePercentil(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Iniciar Teste
                      </Button>
                    </>
                  ) : isDiretor || isCeo ? (
                    <Button onClick={() => { setPercentilNivel("diretoria"); setNovoTestePercentil(true); }}>
                      <Plus className="mr-2 h-4 w-4" /> Iniciar Teste Diretoria
                    </Button>
                  ) : (
                    <Button onClick={() => { setPercentilNivel("gerencial"); setNovoTestePercentil(true); }}>
                      <Plus className="mr-2 h-4 w-4" /> Iniciar Teste Gerencial
                    </Button>
                  )}
                </div>

                {/* Histórico */}
                {loadingPercentil ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : testesPercentil && testesPercentil.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Histórico</h3>
                    {testesPercentil.map((t) => (
                      <Card
                        key={t.id}
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => t.status === "concluido" && setVerPercentil(t)}
                      >
                        <CardContent className="flex items-center justify-between py-3 px-4">
                          <div>
                            <p className="text-sm font-medium">Maturidade Executiva</p>
                            <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">{t.nivel}</Badge>
                            {t.status === "concluido" ? (
                              <Badge variant="default">{t.percentil}%</Badge>
                            ) : (
                              <Badge variant="secondary">
                                {t.status === "aguardando_ia" ? "Processando" : "Em andamento"}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma avaliação realizada ainda.</p>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Testes;
