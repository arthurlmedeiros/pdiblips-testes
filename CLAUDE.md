# Testes — PDI Blips

## Visão Geral

Módulo de avaliações e testes comportamentais + Score Consolidado. Suporta **cinco tipos de teste** distintos, cada um com formulário de entrada e componente de exibição de resultados, e consolida os scores dos 5 testes em uma régua percentil Robert Half v5 (P25°/P50°/P75°).

## Score Consolidado (Robert Half v5)

**Fluxo 100% automático — sem input humano:**
1. Colaborador conclui os 5 testes (Auto, Perfil, C-Level, Bússola, Maturidade) e tem `cargo_id` vinculado no organograma.
2. Ao abrir `TesteCLevelResultado` com status=concluido e score_numerico=null, dispara silenciosamente `gerarScoreIA` (ação `score` da Edge Function `clevel-ai`) → salva `score_numerico` em `pdi_testes_clevel`.
3. Ao abrir `/app/score`, auto-compute derivado de `pdi_colaboradores.cargo_id → pdi_cargos.tipo+nivel` calcula a aderência DISC e insere linha em `pdi_score_consolidado`.
4. Reteste a cada 6 meses (política UX) gera novas linhas → gráfico de evolução.

**Fórmula (pesos fixos):** Auto 10% + Perfil 15% + C-Level 30% + Bússola 15% + Maturidade 30% → `score_raw` → `getDisplayScore` (piecewise) → banda P25°/P50°/P75°.

**Acesso:**
- gerente: só o próprio score
- admin_diretor: próprio + equipe do setor; sem régua
- admin_geral/admin_ceo: tudo + régua de distribuição

**Arquivos novos:**
- `utils/scoreCalculation.ts` — aderência DISC × cargo, normalizações (`MAX_AUTO=35`, `MAX_BUSSOLA=76`), `getDisplayScore`, `calculateScore`, `deriveAderenciaFromCargo`, `percentilSalarial`
- `hooks/useScoreConsolidado.ts` — CRUD de `pdi_score_consolidado`, `latestByColaborador`
- `components/score/` — ScoreCard, ScoreDecompositionTable, ScoreMissingChecklist, ScoreEvolutionChart, PercentileRulerChart, DossieCard
- `pages/Score.tsx` — rota `/app/score` com auto-compute guardado por hash

---

---

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/Testes.tsx` | Página principal — tabs responsivos, seletor de colaborador, histórico por teste |
| `src/components/testes/TesteAutoAvaliacaoForm.tsx` | Formulário Auto Avaliação — 2 blocos: dados profissionais + pontuação 0–5 em 7 dimensões |
| `src/components/testes/TesteAutoAvaliacaoResultado.tsx` | Resultado da Auto Avaliação — BarChart Recharts + badge de nível + dados profissionais |
| `src/components/testes/TestePerfilForm.tsx` | Formulário do perfil comportamental (25 perguntas, resultado dominante) |
| `src/components/testes/TestePerfilResultado.tsx` | Exibição do perfil comportamental — animal/arquétipo dominante |
| `src/components/testes/TesteCLevelForm.tsx` | Formulário avaliação C-Level com aprofundamento via IA |
| `src/components/testes/TesteCLevelResultado.tsx` | Exibição do laudo C-Level gerado por IA |
| `src/components/testes/TesteBussolaForm.tsx` | Formulário Bússola Alta Performance (19 categorias) |
| `src/components/testes/TesteBussolaResultado.tsx` | Resultado da Bússola — RadarChart por categoria |
| `src/components/testes/TestePercentilForm.tsx` | Formulário Maturidade Executiva (gerencial/diretoria) |
| `src/components/testes/TestePercentilResultado.tsx` | Resultado percentil — régua 3 bandas + laudo IA |
| `src/components/testes/TesteEquipeSection.tsx` | Seção "Minha Equipe" — colapsível, tabela de testes por colaborador, Sheet de detalhe |
| `src/hooks/useTestesAutoAvaliacao.ts` | CRUD de `pdi_testes_auto_avaliacao` via React Query |
| `src/hooks/useTestesPerfil.ts` | CRUD de `pdi_testes_perfil` via React Query |
| `src/hooks/useTestesCLevel.ts` | CRUD de `pdi_testes_clevel` via React Query |
| `src/hooks/useTestesBussola.ts` | CRUD de `pdi_testes_bussola` via React Query |
| `src/hooks/useTestesPercentil.ts` | CRUD de `pdi_testes_percentil` via React Query |

---

## Contexto Técnico

### Tabelas Envolvidas

| Tabela | Descrição |
|--------|-----------|
| `pdi_testes_auto_avaliacao` | Auto Avaliação — `dados_pessoais (JSONB)`, `pontuacoes (JSONB)`, `pontuacao_total (NUMERIC)` |
| `pdi_testes_perfil` | Perfil comportamental — `respostas (JSONB)`, `resultado (JSONB)`, `perfil_dominante (text)` |
| `pdi_testes_clevel` | Avaliação C-Level — `respostas_iniciais`, `respostas_aprofundamento`, `laudo`, `status` |
| `pdi_testes_bussola` | Bússola Alta Performance — `respostas (JSONB)`, `pontuacoes (JSONB)`, `pontuacao_total` |
| `pdi_testes_percentil` | Maturidade Executiva — `nivel`, `score_total`, `percentil`, `laudo_ia`, `status` |
| `pdi_resultados_testes` | Tabela legada de resultados — mantida para histórico |

Todas as tabelas têm `colaborador_id` (nullable) e `user_id NOT NULL DEFAULT auth.uid()`.

### Tipos de Teste

| Tab | Tipo | Tabela | Hook |
|-----|------|--------|------|
| `auto_avaliacao` (1ª aba) | Auto Avaliação | `pdi_testes_auto_avaliacao` | `useTestesAutoAvaliacao` |
| `perfil` | Perfil Comportamental | `pdi_testes_perfil` | `useTestesPerfil` |
| `clevel` | Avaliação C-Level | `pdi_testes_clevel` | `useTestesCLevel` |
| `bussola` | Bússola Alta Performance | `pdi_testes_bussola` | `useTestesBussola` |
| `percentil` | Maturidade Executiva | `pdi_testes_percentil` | `useTestesPercentil` |

### Auto Avaliação — Estrutura

**Bloco 1 — Dados profissionais** (armazenado em `dados_pessoais JSONB`):
```json
{ "formacao": "...", "especializacao": "...", "idade": 30, "experiencia_cargo": 5, "residencia": "..." }
```

**Bloco 2 — Pontuações 0–5** (armazenado em `pontuacoes JSONB`):
```json
{ "fluencia_ingles": 3, "uso_tecnologia": 4, "comunicacao_clara": 5, "gestao_conflitos": 2, "decisao_pressao": 3, "organizacao_disciplina": 4, "responsabilidade_ownership": 5 }
```

**Badge de nível** (calculado no frontend a partir de `pontuacao_total` 0–35):
- 0–10 → Iniciante | 11–20 → Em Desenvolvimento | 21–28 → Sênior | 29–35 → Referência

### Sistema de Percentil — 3 Bandas (vigente desde 2026-04-23)

O teste de Maturidade Executiva usa **3 bandas de mercado**:

| Banda | Range raw (DB) | Threshold display |
|-------|---------------|-------------------|
| Percentil 25° | 0–50% | display 0–38 |
| Percentil 50° | 50–95% | display 39–74 |
| Percentil 75° | 95–100% | display 75–100 |

**`getBandName` e `getDisplayScore`** são exportadas de `TestePercentilResultado.tsx` — importar dali ao exibir em outros componentes.

### TesteEquipeSection — Comportamento

- **Fechado por padrão** (`aberto = false`); queries da equipe só carregam ao expandir (lazy loading)
- **Click no nome** do colaborador → chama `onSelectColaborador(id)` passado pela página pai
- Prop: `onSelectColaborador?: (id: string) => void`
- A tabela tem `overflow-x-auto` para funcionar em mobile

### Tabs Responsivas (Testes.tsx)

```tsx
// Wrapper com scroll horizontal — sem flex-wrap
<div className="overflow-x-auto -mx-1 px-1">
  <TabsList className="flex-nowrap w-max min-w-full">
    <TabsTrigger className="flex-shrink-0">
      <Icon className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">Texto da Aba</span>
    </TabsTrigger>
  </TabsList>
</div>
```
Mobile: apenas ícone. Desktop (≥ sm): ícone + texto.

### Padrão Hook

```typescript
export function useTestesAutoAvaliacao(colaboradorId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pdi_testes_auto_avaliacao", colaboradorId ?? "own"],
    queryFn: async () => {
      let q = supabase.from("pdi_testes_auto_avaliacao" as any).select("*").order("created_at", { ascending: false });
      if (colaboradorId) q = q.eq("colaborador_id", colaboradorId);
      else if (user?.id) q = q.eq("user_id", user.id);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as TesteAutoAvaliacao[];
    },
    enabled: !!colaboradorId || !!user?.id,
  });

  const inserir = useMutation({
    mutationFn: async (payload) => { /* insert */ },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pdi_testes_auto_avaliacao"] }),
  });

  return { ...query, inserir };
}
```

Query keys: `["pdi_testes_auto_avaliacao", colaboradorId ?? "own"]` — invalidar pela chave base.

---

## Imports

```ts
import { useTestesAutoAvaliacao } from '@/hooks/useTestesAutoAvaliacao'
import { useTestesPerfil } from '@/hooks/useTestesPerfil'
import { useTestesCLevel } from '@/hooks/useTestesCLevel'
import { useTestesBussola } from '@/hooks/useTestesBussola'
import { useTestesPercentil } from '@/hooks/useTestesPercentil'
import TesteAutoAvaliacaoForm from '@/components/testes/TesteAutoAvaliacaoForm'
import TesteAutoAvaliacaoResultado from '@/components/testes/TesteAutoAvaliacaoResultado'
```

---

## Restrições

1. **Sem edição de testes concluídos** — testes são imutáveis após criação
2. **Auto Avaliação não tem enum em `pdi_tipo_teste`** — usa tabela própria separada do enum legado
3. **Acesso Auto Avaliação**: usuário vê/insere os próprios; `admin_geral`, `admin_ceo`, `admin_diretor` veem de qualquer colaborador
4. **Acesso outros testes**: `admin_geral` e `admin_ceo` podem iniciar para qualquer colaborador; demais roles apenas os próprios
5. `canStartTests` na Testes.tsx: `isAdmin || isCeo || isDiretor || isOwn || !colaboradorId`

---

## Modo Standalone vs Delegado

**Standalone**: clonar para trabalhar nos formulários, lógica de scoring e visualização de resultados de forma isolada.

**Delegado**: o orquestrador injeta este módulo ao coordenar tarefas que relacionem resultados de testes com PDI (competências), dashboard (KPIs) ou nota profissional do colaborador (feature futura).
