import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTestesAutoAvaliacao } from "@/hooks/useTestesAutoAvaliacao";
import { ClipboardCheck } from "lucide-react";

const SCORES = [0, 1, 2, 3, 4, 5] as const;

const DIMENSOES = [
  { key: "fluencia_ingles" as const, label: "Fluência em Inglês" },
  { key: "uso_tecnologia" as const, label: "Uso de Tecnologia" },
  { key: "comunicacao_clara" as const, label: "Comunicação Clara" },
  { key: "gestao_conflitos" as const, label: "Gestão de Conflitos" },
  { key: "decisao_pressao" as const, label: "Decisão sob Pressão" },
  { key: "organizacao_disciplina" as const, label: "Organização e Disciplina" },
  { key: "responsabilidade_ownership" as const, label: "Responsabilidade e Ownership" },
];

const schema = z.object({
  formacao: z.string().min(1, "Formação é obrigatória"),
  especializacao: z.string().min(1, "Especialização é obrigatória").max(500, "Máximo 500 caracteres"),
  idade: z.coerce.number().int("Deve ser um número inteiro").min(14, "Mínimo 14 anos").max(80, "Máximo 80 anos"),
  experiencia_cargo: z.coerce.number().int("Deve ser um número inteiro").min(0, "Mínimo 0 anos"),
  residencia: z.string().min(1, "Residência é obrigatória"),
  fluencia_ingles: z.number().min(0).max(5),
  uso_tecnologia: z.number().min(0).max(5),
  comunicacao_clara: z.number().min(0).max(5),
  gestao_conflitos: z.number().min(0).max(5),
  decisao_pressao: z.number().min(0).max(5),
  organizacao_disciplina: z.number().min(0).max(5),
  responsabilidade_ownership: z.number().min(0).max(5),
});

type FormData = z.infer<typeof schema>;

interface Props {
  colaboradorId: string | undefined;
  onConcluido: () => void;
}

function ScoreSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex gap-2 flex-wrap">
        {SCORES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={cn(
              "w-10 h-10 rounded-full border-2 text-sm font-semibold transition-all",
              value === s
                ? "bg-primary text-primary-foreground border-primary scale-110"
                : "border-input bg-background hover:bg-accent hover:border-primary/50"
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground px-1 w-[272px]">
        <span>Iniciante</span>
        <span>Especialista</span>
      </div>
    </div>
  );
}

export default function TesteAutoAvaliacaoForm({ colaboradorId, onConcluido }: Props) {
  const { inserir } = useTestesAutoAvaliacao(colaboradorId);

  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      formacao: "",
      especializacao: "",
      idade: undefined as any,
      experiencia_cargo: undefined as any,
      residencia: "",
      fluencia_ingles: 0,
      uso_tecnologia: 0,
      comunicacao_clara: 0,
      gestao_conflitos: 0,
      decisao_pressao: 0,
      organizacao_disciplina: 0,
      responsabilidade_ownership: 0,
    },
  });

  const onSubmit = async (data: FormData) => {
    const pontuacoes = {
      fluencia_ingles: data.fluencia_ingles,
      uso_tecnologia: data.uso_tecnologia,
      comunicacao_clara: data.comunicacao_clara,
      gestao_conflitos: data.gestao_conflitos,
      decisao_pressao: data.decisao_pressao,
      organizacao_disciplina: data.organizacao_disciplina,
      responsabilidade_ownership: data.responsabilidade_ownership,
    };

    const pontuacao_total = Object.values(pontuacoes).reduce((a, b) => a + b, 0);

    await inserir.mutateAsync({
      colaborador_id: colaboradorId ?? null,
      dados_pessoais: {
        formacao: data.formacao,
        especializacao: data.especializacao,
        idade: data.idade,
        experiencia_cargo: data.experiencia_cargo,
        residencia: data.residencia,
      },
      pontuacoes,
      pontuacao_total,
    });

    toast.success("Auto avaliação concluída!");
    onConcluido();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Bloco 1: Dados Pessoais/Profissionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="h-5 w-5" />
            Dados Profissionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="formacao">Formação</Label>
            <Textarea
              id="formacao"
              placeholder="Descreva sua formação acadêmica e cursos relevantes..."
              rows={3}
              {...register("formacao")}
            />
            {errors.formacao && <p className="text-sm text-destructive">{errors.formacao.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="especializacao">Especialização</Label>
            <Input
              id="especializacao"
              placeholder="Área de especialização principal"
              maxLength={500}
              {...register("especializacao")}
            />
            {errors.especializacao && <p className="text-sm text-destructive">{errors.especializacao.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="idade">Idade</Label>
              <Input
                id="idade"
                type="number"
                placeholder="Ex: 32"
                min={14}
                max={80}
                {...register("idade")}
              />
              {errors.idade && <p className="text-sm text-destructive">{errors.idade.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="experiencia_cargo">Experiência no cargo (anos)</Label>
              <Input
                id="experiencia_cargo"
                type="number"
                placeholder="Ex: 5"
                min={0}
                {...register("experiencia_cargo")}
              />
              {errors.experiencia_cargo && <p className="text-sm text-destructive">{errors.experiencia_cargo.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="residencia">Residência</Label>
            <Input
              id="residencia"
              placeholder="Cidade, Estado"
              {...register("residencia")}
            />
            {errors.residencia && <p className="text-sm text-destructive">{errors.residencia.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Bloco 2: Auto Pontuação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Auto Pontuação de Competências</CardTitle>
          <p className="text-sm text-muted-foreground">
            Selecione a nota que melhor representa seu nível atual em cada dimensão.
            <span className="block mt-1 font-medium">0 = Iniciante · 5 = Especialista</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {DIMENSOES.map((dim, i) => (
            <div key={dim.key}>
              {i > 0 && <Separator className="mb-6" />}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <Label className="text-sm font-medium min-w-[200px]">{dim.label}</Label>
                <Controller
                  name={dim.key}
                  control={control}
                  render={({ field }) => (
                    <ScoreSelector value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onConcluido}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Concluir Auto Avaliação"}
        </Button>
      </div>
    </form>
  );
}
