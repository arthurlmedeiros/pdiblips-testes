import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface Props {
  laudo: string;
  createdAt?: string;
}

export default function TesteCLevelResultado({ laudo, createdAt }: Props) {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Laudo C-Level</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
            h1 { font-size: 1.5rem; } h2 { font-size: 1.25rem; margin-top: 1.5rem; }
            h3 { font-size: 1.1rem; } ul, ol { padding-left: 1.5rem; }
          </style>
        </head>
        <body>${laudo.replace(/\n/g, "<br>")}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Laudo C-Level</CardTitle>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
        </div>
        {createdAt && (
          <p className="text-xs text-muted-foreground">
            Gerado em {new Date(createdAt).toLocaleDateString("pt-BR")}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
          {laudo}
        </div>
      </CardContent>
    </Card>
  );
}
