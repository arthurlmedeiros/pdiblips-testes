import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Brain, Award, Compass, BarChart3, Loader2, ChevronRight } from "lucide-react";
import { useTestesPerfil, type TestePerfil } from "@/hooks/useTestesPerfil";
import { useTestesCLevel, type TesteCLevel } from "@/hooks/useTestesCLevel";
import { useTestesBussola, type TesteBussola } from "@/hooks/useTestesBussola";
import { useTestesPercentil, type TestePercentil } from "@/hooks/useTestesPercentil";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useAuth } from "@/contexts/AuthContext";
import TestePerfilForm from "@/components/testes/TestePerfilForm";
import TestePerfilResultado, { PERFIL_ANIMAL_NAME } from "@/components/testes/TestePerfilResultado";
import TesteCLevelForm from "@/components/testes/TesteCLevelForm";
import TesteCLevelResultado from "@/components/testes/TesteCLevelResultado";
import TesteBussolaForm from "@/components/testes/TesteBussolaForm";
import TesteBussolaResultado from "@/components/testes/TesteBussolaResultado";
import TestePercentilForm from "@/components/testes/TestePercentilForm";
import TestePercentilResultado from "@/components/testes/TestePercentilResultado";
import TesteEquipeSection from "@/components/testes/TesteEquipeSection";

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
  const isGerente = !isAdmin && !isDiretor && !isCeo;
  const meuColaborador = colaboradores?.find(c => c.user_id === user?.id);
  const isOwn = !!meuColaborador && colaboradorId === meuColaborador.id;
  const canStartTests = isGerente || isDiretor || isOwn;

  const hasPerfilCompleto = !!(testesPerfil && testesPerfil.length > 0);
  const hasCLevelCompleto = !!(testesCLevel && testesCLevel.some((t) => t.status === "concluido"));
  const hasBussolaCompleto = !!(testesBussola && testesBussola.length > 0);
  const hasPercentilCompleto = !!(testesPercentil && testesPercentil.some((t) => t.status === "concluido"));

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

      {/* Seletor de colaborador — apenas admin e CEO */}
      {(isAdmin || isCeo) && (
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
      )}

      {/* Banner informativo para usuários sem vínculo com o organograma */}
      {isGerente && !meuColaborador && !loadingColabs && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Seu usuário ainda não está vinculado ao organograma. Seus testes serão salvos e vinculados automaticamente quando o administrador realizar a vinculação.
        </div>
      )}

      {loadingColabs ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
            Carregando...
          </CardContent>
        </Card>
      ) : (isAdmin || isCeo) && !colaboradorId ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
            Selecione um colaborador para visualizar ou iniciar testes
          </CardContent>
        </Card>
      ) : (
        <>
        <Tabs defaultValue="perfil">
          <TabsList className="flex-wrap">
            <TabsTrigger value="perfil" className="relative">
              <Brain className="mr-2 h-4 w-4" /> Perfil Comportamental
              {hasPerfilCompleto && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />}
            </TabsTrigger>
            <TabsTrigger value="clevel" className="relative">
              <Award className="mr-2 h-4 w-4" /> Avaliação C-Level
              {hasCLevelCompleto && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />}
            </TabsTrigger>
            <TabsTrigger value="bussola" className="relative">
              <Compass className="mr-2 h-4 w-4" /> Bússola Alta Performance
              {hasBussolaCompleto && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />}
            </TabsTrigger>
            <TabsTrigger value="percentil" className="relative">
              <BarChart3 className="mr-2 h-4 w-4" /> Maturidade Executiva
              {hasPercentilCompleto && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />}
            </TabsTrigger>
          </TabsList>

          {/* TAB: Perfil Comportamental */}
          <TabsContent value="perfil" className="space-y-4">
            {novoTestePerfil ? (
              <TestePerfilForm colaboradorId={colaboradorId || undefined} onConcluido={() => setNovoTestePerfil(false)} />
            ) : verPerfil ? (
              <div className="space-y-4">
                <TestePerfilResultado resultado={verPerfil.resultado} perfilDominante={verPerfil.perfil_dominante} createdAt={verPerfil.created_at} />
                <Button variant="outline" onClick={() => setVerPerfil(null)}>Voltar ao histórico</Button>
              </div>
            ) : (
              <>
                {canStartTests && (
                  <Button onClick={() => setNovoTestePerfil(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Iniciar Teste de Perfil
                  </Button>
                )}
                {loadingPerfil ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : testesPerfil && testesPerfil.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Histórico</h3>
                    {testesPerfil.map((t) => (
                      <Card key={t.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setVerPerfil(t)}>
                        <CardContent className="flex items-center justify-between py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{t.perfil_dominante === "idealista" ? "🦅" : t.perfil_dominante === "focado" ? "🦈" : t.perfil_dominante === "afetivo" ? "🐱" : "🐺"}</span>
                            <div>
                              <p className="text-sm font-medium">Perfil Comportamental</p>
                              <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{PERFIL_ANIMAL_NAME[t.perfil_dominante] || t.perfil_dominante}</Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                      <Brain className="h-10 w-10 text-muted-foreground/40" />
                      <div>
                        <p className="font-medium text-foreground">Nenhum teste realizado ainda</p>
                        <p className="text-sm text-muted-foreground mt-1">Descubra seu perfil comportamental dominante entre os 4 arquétipos.</p>
                      </div>
                      {canStartTests && (
                        <Button size="sm" onClick={() => setNovoTestePerfil(true)}>
                          <Plus className="mr-2 h-4 w-4" /> Iniciar agora
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* TAB: C-Level */}
          <TabsContent value="clevel" className="space-y-4">
            {novoTesteCLevel ? (
              <TesteCLevelForm
                colaboradorId={colaboradorId || undefined}
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
                {canStartTests && (
                  <Button onClick={() => setNovoTesteCLevel(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Iniciar Avaliação C-Level
                  </Button>
                )}
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
                          <div className="flex items-center gap-2">
                            <Badge variant={t.status === "concluido" ? "default" : "secondary"}>
                              {t.status === "concluido" ? "Concluído" : t.status === "aguardando_aprofundamento" ? "Em andamento" : "Iniciado"}
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                      <Award className="h-10 w-10 text-muted-foreground/40" />
                      <div>
                        <p className="font-medium text-foreground">Nenhuma avaliação realizada ainda</p>
                        <p className="text-sm text-muted-foreground mt-1">Avaliação aprofundada com laudo gerado por IA para perfis executivos.</p>
                      </div>
                      {canStartTests && (
                        <Button size="sm" onClick={() => setNovoTesteCLevel(true)}>
                          <Plus className="mr-2 h-4 w-4" /> Iniciar agora
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* TAB: Bússola Alta Performance */}
          <TabsContent value="bussola" className="space-y-4">
            {novoTesteBussola ? (
              <TesteBussolaForm colaboradorId={colaboradorId || undefined} onConcluido={() => setNovoTesteBussola(false)} />
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
                {canStartTests && (
                  <Button onClick={() => setNovoTesteBussola(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Iniciar Bússola da Alta Performance
                  </Button>
                )}
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
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{t.pontuacao_total}/76</Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                      <Compass className="h-10 w-10 text-muted-foreground/40" />
                      <div>
                        <p className="font-medium text-foreground">Nenhuma avaliação realizada ainda</p>
                        <p className="text-sm text-muted-foreground mt-1">Mapeie os pilares de alta performance em 19 dimensões comportamentais.</p>
                      </div>
                      {canStartTests && (
                        <Button size="sm" onClick={() => setNovoTesteBussola(true)}>
                          <Plus className="mr-2 h-4 w-4" /> Iniciar agora
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* TAB: Maturidade Executiva (Percentil) */}
          <TabsContent value="percentil" className="space-y-4">
            {novoTestePercentil ? (
              <TestePercentilForm
                colaboradorId={colaboradorId || undefined}
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
                {canStartTests && (
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
                )}

                {/* Histórico */}
                {loadingPercentil ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : testesPercentil && testesPercentil.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Histórico</h3>
                    {testesPercentil.map((t) => (
                      <Card
                        key={t.id}
                        className={`transition-colors ${t.status === "concluido" ? "cursor-pointer hover:bg-accent/50" : "opacity-70"}`}
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
                            {t.status === "concluido" && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                      <BarChart3 className="h-10 w-10 text-muted-foreground/40" />
                      <div>
                        <p className="font-medium text-foreground">Nenhuma avaliação realizada ainda</p>
                        <p className="text-sm text-muted-foreground mt-1">Avalie a maturidade executiva com score percentual e laudo detalhado por pilar.</p>
                      </div>
                      {canStartTests && (
                        <Button size="sm" onClick={() => setNovoTestePercentil(true)}>
                          <Plus className="mr-2 h-4 w-4" /> Iniciar agora
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Seção Minha Equipe — admin, CEO e diretores */}
        {(isAdmin || isCeo || isDiretor) && colaboradores && colaboradores.length > 0 && (
          <TesteEquipeSection
            colaboradores={colaboradores.filter(c => c.user_id !== user?.id)}
          />
        )}
        </>
      )}
    </div>
  );
};

export default Testes;
