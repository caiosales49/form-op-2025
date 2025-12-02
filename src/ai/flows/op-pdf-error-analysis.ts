'use server';

/**
 * @fileOverview Analyzes a generated OP PDF against historical OP structures to identify potential errors or areas for optimization.
 *
 * - analyzeOpPdf - A function that handles the OP PDF analysis process.
 * - AnalyzeOpPdfInput - The input type for the analyzeOpPdf function.
 * - AnalyzeOpPdfOutput - The return type for the analyzeOpPdf function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeOpPdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document of an OP (ordem de pagamento), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  historicalOpStructureDescription: z
    .string()
    .describe(
      'A description of the historical OP structure to compare against.'
    ),
});
export type AnalyzeOpPdfInput = z.infer<typeof AnalyzeOpPdfInputSchema>;

const AnalyzeOpPdfOutputSchema = z.object({
  analysisResult: z
    .string()
    .describe(
      'The analysis result, identifying potential errors or areas for optimization in the OP PDF compared to the historical structure.'
    ),
});
export type AnalyzeOpPdfOutput = z.infer<typeof AnalyzeOpPdfOutputSchema>;

export async function analyzeOpPdf(input: AnalyzeOpPdfInput): Promise<AnalyzeOpPdfOutput> {
  return analyzeOpPdfFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeOpPdfPrompt',
  input: {schema: AnalyzeOpPdfInputSchema},
  output: {schema: AnalyzeOpPdfOutputSchema},
  prompt: `You are an expert in analyzing OP (ordem de pagamento) documents.

You will analyze the provided OP PDF data against the historical OP structure description to identify potential errors or areas for optimization.

OP PDF Data: {{media url=pdfDataUri}}
Historical OP Structure Description: {{{historicalOpStructureDescription}}}

Analysis should focus on identifying discrepancies in data fields, formatting inconsistencies, and potential compliance issues. Return a detailed analysis result.
`,
});

const analyzeOpPdfFlow = ai.defineFlow(
  {
    name: 'analyzeOpPdfFlow',
    inputSchema: AnalyzeOpPdfInputSchema,
    outputSchema: AnalyzeOpPdfOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
