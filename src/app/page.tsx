"use client";

import React, { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { OpGeneratorForm, type OpFormValues } from "@/components/op-generator-form";
import { PdfPreview } from "@/components/pdf-preview";
import { generateOpPdf } from "@/lib/pdf-generator";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [pdfDataUri, setPdfDataUri] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleFormSubmit = (data: OpFormValues) => {
    setIsGenerating(true);
    // Use a short timeout to allow the UI to update to the loading state
    setTimeout(() => {
      try {
        const uri = generateOpPdf(data);
        setPdfDataUri(uri);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        console.error("Failed to generate PDF", error);
        toast({
          variant: "destructive",
          title: "Erro ao Gerar PDF",
          description: "Ocorreu um problema ao criar o documento. Tente novamente.",
        });
      } finally {
        setIsGenerating(false);
      }
    }, 50);
  };
  
  const handleNewOp = () => {
    setPdfDataUri(null);
  }

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight flex items-center justify-center gap-3">
          <FileSpreadsheet className="h-10 w-10 text-primary" />
          Gerador de OP
        </h1>
        <p className="text-muted-foreground mt-2">
          Crie e visualize suas Ordens de Pagamento com facilidade.
        </p>
      </header>

      <div className="max-w-4xl mx-auto">
        {!pdfDataUri ? (
          <OpGeneratorForm onFormSubmit={handleFormSubmit} isGenerating={isGenerating} />
        ) : (
          <div className="space-y-4">
             <Button onClick={handleNewOp} className="w-full text-lg py-6">
                Gerar Nova OP
             </Button>
            <PdfPreview pdfDataUri={pdfDataUri} />
          </div>
        )}
      </div>
    </main>
  );
}
