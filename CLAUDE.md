# Testes — PDI Blips

## Visão Geral

Módulo de avaliações e testes comportamentais. Suporta quatro tipos de teste distintos, cada um com formulário de entrada e componente de exibição de resultados. Os resultados são armazenados em tabelas separadas por tipo.

---

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/Testes.tsx` | Página principal — lista testes realizados e abre dialogs por tipo |
| `src/components/testes/PerfilComportamentalForm.tsx` | Formulário para perfil comportamental (DISC/similar) |
| `src/components/testes/PerfilComportamentalResultado.tsx` | Exibição dos resultados de perfil comportamental |
| `src/components/testes/NivelCLevelForm.tsx` | Formulário para avaliação nível C-Level |
| `src/components/testes/NivelCLevelResultado.tsx` | Exibição dos resultados de nível C-Level |
| `src/components/testes/BussolaAltaPerformanceForm.tsx` | Formulário para bússola de alta performance |
| `src/components/testes/BussolaAltaPerformanceResultado.tsx` | Exibição dos resultados da bússola |
| `src/components/testes/PercentilForm.tsx` | Formulário para avaliação percentil |
| `src/components/testes/PercentilResultado.tsx` | Exibição dos resultados percentil |
| `src/hooks/useTestesPerfil.ts` | CRUD de `pdi_testes_perfil` via React Query |
| `src/hooks/useTestesCLevel.ts` | CRUD de `pdi_testes_clevel` via React Query |
| `src/hooks/useTestesBussola.ts` | CRUD de testes bússola via React Query |
| `src/hooks/useTestesPercentil.ts` | CRUD de testes percentil via React Query |

---

## Contexto Técnico

### Tabelas Envolvidas

| Tabela | Descrição |
|--------|-----------|
| `pdi_testes` | Registro base de teste — campos: `colaborador_id`, `tipo`, `data_realizacao`, `aplicador_id` |
| `pdi_testes_perfil` | Resultados do perfil comportamental — scores por dimensão (D, I, S, C ou similar) |
| `pdi_testes_clevel` | Avaliações C-Level — campos específicos de liderança e estratégia |
| `pdi_testes_bussola` | Resultados da bússola de alta performance |
| `pdi_resultados_testes` | Tabela consolidada de resultados para consulta no dashboard |

### Enum de Tipos

```ts
type pdi_tipo_teste =
  | 'perfil_comportamental'
  | 'nivel_clevel'
  | 'bussola_alta_performance'
  | 'percentil'
```

### Tipos de Teste

| Tipo | Descrição | Tabela de Resultado |
|------|-----------|---------------------|
| `perfil_comportamental` | Análise comportamental com múltiplas dimensões (estilo DISC) | `pdi_testes_perfil` |
| `nivel_clevel` | Avaliação de maturidade para posições C-Level | `pdi_testes_clevel` |
| `bussola_alta_performance` | Diagnóstico de performance e engajamento | `pdi_testes_bussola` |
| `percentil` | Posicionamento percentil em competências | `pdi_resultados_testes` |

### Padrão Form → Resultado

Cada tipo segue o fluxo:
1. `*Form.tsx`: Dialog com React Hook Form + Zod; ao submeter insere em `pdi_testes` + tabela de resultado específica
2. `*Resultado.tsx`: recebe `testeId`, carrega resultado via hook, exibe visualização (charts, scores, texto)
3. A página `Testes.tsx` controla qual form/resultado abrir com base no `tipo`

```tsx
// Exemplo de controle na página
{activeTab === 'perfil_comportamental' && (
  <PerfilComportamentalForm open={formOpen} onOpenChange={setFormOpen} colaboradorId={selectedId} />
)}
```

---

## Imports

```ts
import { useTestesPerfil } from '@testes/hooks/useTestesPerfil'
import { useTestesCLevel } from '@testes/hooks/useTestesCLevel'
import { useTestesBussola } from '@testes/hooks/useTestesBussola'
import { useTestesPercentil } from '@testes/hooks/useTestesPercentil'
import PerfilComportamentalForm from '@testes/components/testes/PerfilComportamentalForm'
```

---

## Restrições

1. **Inserção atômica**: criar registro em `pdi_testes` e na tabela de resultado em uma única operação (ou transação via RPC)
2. **Sem edição de testes concluídos** — testes são imutáveis após criação
3. **Tipos são enum fixo** — não adicionar tipos novos sem migration no banco e atualização do enum
4. **Acesso**: todos os roles autenticados podem ver testes; somente `admin_geral` e `admin_diretor` podem criar testes para outros colaboradores

---

## Modo Standalone vs Delegado

**Standalone**: clonar para trabalhar nos formulários, lógica de scoring e visualização de resultados de forma isolada.

**Delegado**: o orquestrador injeta este módulo ao coordenar tarefas que relacionem resultados de testes com PDI (competências) ou dashboard (KPIs comportamentais).
