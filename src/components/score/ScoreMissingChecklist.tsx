import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ChecklistStatus {
  cargo: boolean;
  auto: boolean;
  perfil: boolean;
  clevel: boolean;
  clevelScore: boolean;
  bussola: boolean;
  maturidade: boolean;
}

interface Props {
  status: ChecklistStatus;
}

export default function ScoreMissingChecklist({ status }: Props) {
  const items = [
    { label: "Cargo vinculado no organograma",              done: status.cargo },
    { label: "Auto Avaliação",                               done: status.auto },
    { label: "Perfil Comportamental",                        done: status.perfil },
    { label: "Avaliação C-Level (laudo)",                    done: status.clevel },
    { label: "Score C-Level gerado pela IA",                 done: status.clevelScore },
    { label: "Bússola de Alta Performance",                  done: status.bussola },
    { label: "Maturidade Executiva",                         done: status.maturidade },
  ];
  const faltam = items.filter((i) => !i.done).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {faltam === 0
            ? "Calculando score…"
            : `Faltam ${faltam} ${faltam === 1 ? "item" : "itens"} para gerar o score consolidado`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((i, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm">
              {i.done ? (
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <X className="h-4 w-4 text-red-500 shrink-0" />
              )}
              <span className={i.done ? "text-muted-foreground line-through" : ""}>
                {i.label}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
