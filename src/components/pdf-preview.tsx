"use client";

import React from "react";
import { FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface PdfPreviewProps {
  pdfDataUri: string;
}

export function PdfPreview({ pdfDataUri }: PdfPreviewProps) {
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
    </div>
  );
}
