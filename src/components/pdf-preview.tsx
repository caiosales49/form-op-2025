"use client";

import React, { useState, useTransition } from "react";
import { Bot, FileText, Loader2, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { runPdfAnalysis } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface PdfPreviewProps {
  pdfDataUri: string;
}

export function PdfPreview({ pdfDataUri }: PdfPreviewProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleAnalysis = (formData: FormData) => {
    const historicalDescription = formData.get("historicalOpStructureDescription") as string;
    if (!historicalDescription.trim()) {
      toast({
        variant: "destructive",
        title: "Campo obrigatório",
        description: "Por favor, descreva a estrutura histórica da OP.",
      });
      return;
    }

    formData.append("pdfDataUri", pdfDataUri);

    startTransition(async () => {
      setAnalysisResult(null);
      const result = await runPdfAnalysis(formData);
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Erro na Análise",
          description: result.error,
        });
        setAnalysisResult(null);
      } else if (result.success) {
        setAnalysisResult(result.success);
        toast({
          title: "Análise Concluída",
          description: "A IA analisou seu documento com sucesso.",
        });
      }
    });
  };

  return (
    <div className="space-y-8 mt-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText /> Pré-visualização da OP</CardTitle>
          <CardDescription>
            Seu documento PDF está pronto. Revise abaixo antes de salvar ou imprimir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <iframe
            src={pdfDataUri}
            className="w-full h-[600px] rounded-md border"
            title="Pré-visualização da OP"
          ></iframe>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/>Análise com IA</CardTitle>
          <CardDescription>
            Compare seu PDF gerado com estruturas históricas para encontrar
            erros ou oportunidades de otimização.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={handleAnalysis} className="space-y-4">
            <Textarea
              name="historicalOpStructureDescription"
              placeholder="Descreva a estrutura de uma OP histórica aqui. Por exemplo: 'A OP deve conter o nome completo, CPF, dados bancários e uma tabela com descrição e valor. O total deve ser R$ XXX,XX.'"
              rows={5}
              required
              className="bg-card"
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Bot className="mr-2 h-4 w-4" />
              )}
              {isPending ? "Analisando..." : "Analisar com IA"}
            </Button>
          </form>

          {isPending && (
             <div className="mt-6 flex flex-col items-center justify-center gap-4 text-center p-8 border rounded-lg bg-background/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">A IA está processando seu documento... Isso pode levar um momento.</p>
            </div>
          )}

          {analysisResult && !isPending && (
            <Alert className="mt-6 bg-accent/30 border-accent/50">
              <Bot className="h-4 w-4 text-accent-foreground" />
              <AlertTitle className="text-accent-foreground">Resultado da Análise</AlertTitle>
              <AlertDescription>
                <p className="whitespace-pre-wrap text-accent-foreground/90">{analysisResult}</p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
