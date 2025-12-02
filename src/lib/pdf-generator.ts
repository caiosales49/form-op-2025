import jsPDF from "jspdf";
import "jspdf-autotable";
import { format, nextWednesday } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { OpFormValues } from "@/components/op-generator-form";

// This is needed for jspdf-autotable to work with jsPDF
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function generateOpPdf(data: OpFormValues): string {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("ORDEM de PAGAMENTO", doc.internal.pageSize.getWidth() / 2, 20, {
    align: "center",
  });

  doc.setLineWidth(0.5);
  doc.line(14, 28, doc.internal.pageSize.getWidth() - 14, 28);

  // Payee Info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Beneficiário", 14, 40);
  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${data.fullName}`, 14, 48);
  doc.text(`Banco: ${data.bankName}`, 14, 56);
  doc.text(`Agência: ${data.agency} / Conta: ${data.account}`, 14, 64);

  doc.line(14, 70, doc.internal.pageSize.getWidth() - 14, 70);

  // Payment Details Table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Detalhes do Pagamento", 14, 80);

  const tableBody = data.paymentPeriods.map((period) => [
    "Alimentação",
    `${format(period.startDate, "dd/MM/yy")} a ${format(
      period.endDate,
      "dd/MM/yy"
    )}`,
    `R$ ${period.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
  ]);

  const total = data.paymentPeriods.reduce(
    (sum, period) => sum + period.value,
    0
  );

  doc.autoTable({
    startY: 85,
    head: [["Descrição", "Período", "Valor"]],
    body: tableBody,
    theme: "grid",
    headStyles: { fillColor: [22, 163, 74], textColor: 255 }, // Green header
    styles: { font: "helvetica", fontSize: 10 },
  });

  const finalY = (doc as any).lastAutoTable.finalY;

  // Total
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Valor Total: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    doc.internal.pageSize.getWidth() - 14,
    finalY + 15,
    { align: "right" }
  );

  // Payment Date
  if (data.paymentPeriods.length > 0) {
      const lastEndDate = data.paymentPeriods.reduce((latest, period) => 
        period.endDate > latest ? period.endDate : latest, 
        data.paymentPeriods[0].endDate
      );
      const paymentDate = nextWednesday(lastEndDate);
      const formattedPaymentDate = format(paymentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Data Prevista para Pagamento: ${formattedPaymentDate}`, 14, finalY + 25);
  }
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.text("__________________________________", doc.internal.pageSize.getWidth() / 2, footerY, { align: 'center'});
  doc.setFontSize(10);
  doc.text("Assinatura do Responsável", doc.internal.pageSize.getWidth() / 2, footerY + 5, { align: 'center'});

  return doc.output("datauristring");
}
