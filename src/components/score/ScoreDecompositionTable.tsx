import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PESOS } from "@/utils/scoreCalculation";
import type { ScoreConsolidado } from "@/hooks/useScoreConsolidado";

interface Props {
  score: ScoreConsolidado;
}

export default function ScoreDecompositionTable({ score }: Props) {
  const rows = [
    { nome: "Auto Avaliação",              peso: PESOS.auto,       s: score.score_auto },
    { nome: "Perfil Comportamental",       peso: PESOS.perfil,     s: score.score_perfil_aderencia },
    { nome: "Avaliação C-Level",           peso: PESOS.clevel,     s: score.score_clevel },
    { nome: "Bússola de Alta Performance", peso: PESOS.bussola,    s: score.score_bussola },
    { nome: "Maturidade Executiva",        peso: PESOS.maturidade, s: score.score_maturidade },
  ];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Teste</TableHead>
          <TableHead className="text-right">Peso</TableHead>
          <TableHead className="text-right">Score Raw</TableHead>
          <TableHead className="text-right">Contribuição</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.nome}>
            <TableCell className="font-medium">{r.nome}</TableCell>
            <TableCell className="text-right">{(r.peso * 100).toFixed(0)}%</TableCell>
            <TableCell className="text-right">{r.s.toFixed(1)}</TableCell>
            <TableCell className="text-right font-medium">{(r.peso * r.s).toFixed(2)}</TableCell>
          </TableRow>
        ))}
        <TableRow className="border-t-2 font-bold">
          <TableCell>Total</TableCell>
          <TableCell className="text-right">100%</TableCell>
          <TableCell className="text-right">—</TableCell>
          <TableCell className="text-right">{score.score_raw.toFixed(1)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
