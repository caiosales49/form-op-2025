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

function valueToWords(num: number): string {
    const a = [
        '', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'
    ];
    const b = [
        '', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'
    ];
    const c = [
        '', 'cem', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'
    ];

    const [reais, centavos] = num.toFixed(2).split('.').map(Number);

    const numToWords = (n: number) => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n/10)] + (n % 10 !== 0 ? ' e ' + a[n % 10] : '');
        if (n === 100) return 'cem';
        if (n < 1000) return c[Math.floor(n/100)] + (n % 100 !== 0 ? ' e ' + numToWords(n % 100) : '');
        return '';
    };

    let words = '';
    if (reais > 0) {
        words += numToWords(reais);
        words += reais === 1 ? ' real' : ' reais';
    }

    if (centavos > 0) {
        if (reais > 0) words += ' e ';
        words += numToWords(centavos);
        words += centavos === 1 ? ' centavo' : ' centavos';
    }

    return words.trim();
}


export function generateOpPdf(data: OpFormValues): string {
  const doc = new jsPDF();
  const paymentDescription = data.paymentType === 'fuel' ? 'Combustível' : 'Alimentação';
  const expenseDescription = data.paymentType === 'fuel' ? 'combustível' : 'alimentação e combustível';

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
  doc.text(`CPF: ${data.cpf}`, 14, 56);
  doc.text(`Banco: ${data.bankName}`, 14, 64);
  doc.text(`Agência: ${data.agency} / Conta: ${data.account}`, 14, 72);

  doc.line(14, 80, doc.internal.pageSize.getWidth() - 14, 80);

  // Payment Details Table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Detalhes do Pagamento", 14, 90);

  const tableBody = data.paymentPeriods.map((period) => [
    paymentDescription,
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
    startY: 95,
    head: [["Descrição", "Período", "Valor"]],
    body: tableBody,
    theme: "grid",
    headStyles: { fillColor: [22, 163, 74], textColor: 255 }, // Green header
    styles: { font: "helvetica", fontSize: 10 },
  });

  let finalY = (doc as any).lastAutoTable.finalY;

  // Total
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Valor Total: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    doc.internal.pageSize.getWidth() - 14,
    finalY + 10,
    { align: "right" }
  );

  finalY += 20;

  // Receipt Text
  const totalInWords = valueToWords(total);
  const periodsText = data.paymentPeriods.map(p => 
      `de ${format(p.startDate, "dd/MM")}` +
      ` a ${format(p.endDate, "dd/MM")}`
    ).join(' e ');

  const receiptText = `Eu, ${data.fullName}, portador do CPF ${data.cpf}, Recebi do Metrópoles Mídia e Comunicação S/A, empresa inscrita no CNPJ/MF: 23.035.415/0001-04, a importância de R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${totalInWords}), referente às despesas de ${expenseDescription} no(s) período(s) ${periodsText}.`;
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const splitText = doc.splitTextToSize(receiptText, doc.internal.pageSize.getWidth() - 28);
  doc.text(splitText, 14, finalY + 10);
  finalY += splitText.length * 7;

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
      doc.text(`Data Prevista para Pagamento: ${formattedPaymentDate}`, 14, finalY + 10);
  }
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.text("__________________________________", doc.internal.pageSize.getWidth() / 2, footerY, { align: 'center'});
  doc.setFontSize(10);
  doc.text("Assinatura do Responsável", doc.internal.pageSize.getWidth() / 2, footerY + 5, { align: 'center'});

  return doc.output("datauristring");
}
