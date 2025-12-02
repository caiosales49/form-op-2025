"use server";

import { analyzeOpPdf } from "@/ai/flows/op-pdf-error-analysis";
import { z } from "zod";

const analysisSchema = z.object({
  pdfDataUri: z.string().startsWith("data:application/pdf;base64,"),
  historicalOpStructureDescription: z.string().min(10, "A descrição é muito curta."),
});

export async function runPdfAnalysis(formData: FormData) {
  try {
    const data = {
      pdfDataUri: formData.get("pdfDataUri"),
      historicalOpStructureDescription: formData.get("historicalOpStructureDescription"),
    };

    const validatedData = analysisSchema.safeParse(data);

    if (!validatedData.success) {
        const errorMessages = validatedData.error.errors.map(e => e.message).join(', ');
        return { error: `Dados inválidos: ${errorMessages}` };
    }

    const result = await analyzeOpPdf(validatedData.data);
    return { success: result.analysisResult };
  } catch (error) {
    console.error("Error running PDF analysis:", error);
    // Return a user-friendly error message
    if (error instanceof Error && error.message.includes('media')) {
         return { error: "Ocorreu um erro ao processar o arquivo PDF. Verifique se o formato está correto." };
    }
    return { error: "Ocorreu um erro inesperado ao conectar com o serviço de IA. Tente novamente mais tarde." };
  }
}
