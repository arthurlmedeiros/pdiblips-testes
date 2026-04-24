// pdiblips-testes/src/utils/scoreCalculation.ts
// Lógica pura do Score Consolidado Blips (Robert Half v5).
// Sem deps de React. Importável de qualquer módulo.

export const CARGO_OPTIONS = [
  "Comercial",
  "Operações",
  "TI & Dados",
  "Financeiro & FINZA",
  "Padrão C-Level",
] as const;

export const NIVEL_OPTIONS = ["Diretoria", "Head/Sênior", "Gerência"] as const;

export type CargoOption = (typeof CARGO_OPTIONS)[number];
export type NivelOption = (typeof NIVEL_OPTIONS)[number];

// ── Matriz de aderência DISC × cargo (Robert Half v5)
// Arquétipo: idealista=Águia, organizado=Lobo, focado=Tubarão, afetivo=Gato
const ADERENCIA_MATRIX: Record<string, Record<string, number>> = {
  "Comercial|Diretoria":            { idealista: 90, organizado: 70, focado: 95, afetivo: 85 },
  "Comercial|Head/Sênior":          { idealista: 85, organizado: 75, focado: 95, afetivo: 90 },
  "Comercial|Gerência":             { idealista: 75, organizado: 80, focado: 95, afetivo: 90 },
  "Operações|Diretoria":            { idealista: 80, organizado: 95, focado: 85, afetivo: 80 },
  "Operações|Head/Sênior":          { idealista: 75, organizado: 95, focado: 85, afetivo: 80 },
  "Operações|Gerência":             { idealista: 65, organizado: 95, focado: 80, afetivo: 80 },
  "TI & Dados|Diretoria":           { idealista: 95, organizado: 90, focado: 70, afetivo: 75 },
  "TI & Dados|Head/Sênior":         { idealista: 85, organizado: 90, focado: 70, afetivo: 75 },
  "TI & Dados|Gerência":            { idealista: 75, organizado: 95, focado: 70, afetivo: 80 },
  "Financeiro & FINZA|Diretoria":   { idealista: 80, organizado: 95, focado: 85, afetivo: 70 },
  "Financeiro & FINZA|Head/Sênior": { idealista: 75, organizado: 95, focado: 80, afetivo: 70 },
  "Financeiro & FINZA|Gerência":    { idealista: 65, organizado: 95, focado: 75, afetivo: 70 },
  "Padrão C-Level|Padrão":          { idealista: 90, organizado: 85, focado: 90, afetivo: 80 },
};

export function getAderenciaScore(
  cargo: string,
  nivel: string,
  perfilDominante: string,
): number {
  const nivelKey = cargo === "Padrão C-Level" ? "Padrão" : nivel;
  return ADERENCIA_MATRIX[`${cargo}|${nivelKey}`]?.[perfilDominante] ?? 0;
}

// ── Mapeamento pdi_cargos.tipo → área da matriz de aderência
// Tipo "Outros" cai em Padrão C-Level (sem especialização por área).
export const CARGO_TIPO_TO_AREA: Record<string, CargoOption> = {
  Financeiro: "Financeiro & FINZA",
  FINZA: "Financeiro & FINZA",
  "Mkt & Vendas": "Comercial",
  TI: "TI & Dados",
  Operações: "Operações",
  Outros: "Padrão C-Level",
};

export interface AderenciaAlvo {
  cargo_alvo: CargoOption;
  nivel_cargo: "Diretoria" | "Head/Sênior" | "Gerência" | "Padrão";
}

/**
 * Deriva cargo_alvo + nivel_cargo (matriz de aderência) a partir de um
 * registro pdi_cargos (tipo + nivel). Retorna null se tipo ou nivel forem null/inválidos.
 */
export function deriveAderenciaFromCargo(
  tipo: string | null | undefined,
  nivel: string | null | undefined,
): AderenciaAlvo | null {
  if (!tipo || !nivel) return null;
  const area = CARGO_TIPO_TO_AREA[tipo] ?? "Padrão C-Level";
  if (area === "Padrão C-Level") {
    return { cargo_alvo: "Padrão C-Level", nivel_cargo: "Padrão" };
  }
  const lvl = nivel as NivelOption;
  if (!(NIVEL_OPTIONS as readonly string[]).includes(lvl)) return null;
  return { cargo_alvo: area, nivel_cargo: lvl };
}

// ── Normalizações — conforme DB real do projeto
export const MAX_AUTO = 35; // 7 dims × 5 pts (pdi_testes_auto_avaliacao.pontuacao_total)
export const MAX_BUSSOLA = 76; // 19 dims × 4 pts (pdi_testes_bussola.pontuacao_total)

export function normalizeAutoScore(pontuacaoTotal: number): number {
  return Math.max(
    0,
    Math.min(100, Math.round((pontuacaoTotal / MAX_AUTO) * 100)),
  );
}

export function normalizeBussolaScore(pontuacaoTotal: number): number {
  return Math.max(
    0,
    Math.min(100, Math.round((pontuacaoTotal / MAX_BUSSOLA) * 100)),
  );
}

// ── getDisplayScore — idêntica à do TestePercentilResultado.tsx (âncora semântica)
export function getDisplayScore(raw: number): number {
  if (raw < 95) return Math.round((raw * 75) / 95);
  return Math.round(75 + (raw - 95) * 5);
}

export function getBanda(
  raw: number,
): "Percentil 25°" | "Percentil 50°" | "Percentil 75°" {
  if (raw < 50) return "Percentil 25°";
  if (raw < 95) return "Percentil 50°";
  return "Percentil 75°";
}

export const BANDA_COLORS = {
  "Percentil 25°": {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
    hex: "#ef4444",
  },
  "Percentil 50°": {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    hex: "#f59e0b",
  },
  "Percentil 75°": {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    hex: "#10b981",
  },
} as const;

export const SEIS_MESES_MS = 180 * 24 * 60 * 60 * 1000;

export function isScoreDesatualizado(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() > SEIS_MESES_MS;
}

export function diasAteReteste(createdAt: string): number {
  return Math.max(
    0,
    Math.ceil(
      (new Date(createdAt).getTime() + SEIS_MESES_MS - Date.now()) /
        (1000 * 60 * 60 * 24),
    ),
  );
}

export interface ScoreInputs {
  scoreAuto: number;
  scorePerfilAderencia: number;
  scoreClevel: number;
  scoreBussola: number;
  scoreMaturidade: number;
}

export interface ScoreResult {
  scoreRaw: number;
  scoreDisplay: number;
  banda: "Percentil 25°" | "Percentil 50°" | "Percentil 75°";
}

export const PESOS = {
  auto: 0.1,
  perfil: 0.15,
  clevel: 0.3,
  bussola: 0.15,
  maturidade: 0.3,
} as const;

export function calculateScore(i: ScoreInputs): ScoreResult {
  const scoreRaw =
    Math.round(
      (PESOS.auto * i.scoreAuto +
        PESOS.perfil * i.scorePerfilAderencia +
        PESOS.clevel * i.scoreClevel +
        PESOS.bussola * i.scoreBussola +
        PESOS.maturidade * i.scoreMaturidade) *
        10,
    ) / 10;
  return {
    scoreRaw,
    scoreDisplay: getDisplayScore(scoreRaw),
    banda: getBanda(scoreRaw),
  };
}

// ── Helper para os gráficos salariais do Dashboard
export interface RefSalarial {
  p25: number;
  p50: number;
  p75: number;
}

/**
 * Interpolação linear do salário nas 3 bandas da pesquisa (P25/P50/P75).
 * Retorna percentil 0-100+ (acima de P75 extrapola linearmente).
 */
export function percentilSalarial(salario: number, ref: RefSalarial): number {
  if (salario <= ref.p25)
    return Math.max(0, Math.round((salario / ref.p25) * 25));
  if (salario <= ref.p50)
    return 25 + Math.round(((salario - ref.p25) / (ref.p50 - ref.p25)) * 25);
  if (salario <= ref.p75)
    return 50 + Math.round(((salario - ref.p50) / (ref.p75 - ref.p50)) * 25);
  return 75 + Math.round(((salario - ref.p75) / ref.p75) * 25);
}
