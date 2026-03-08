import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PDFOptions {
  title: string;
  subtitle?: string;
  orgName?: string;
  columns: string[];
  rows: (string | number)[][];
  filename: string;
}

export const generateTablePDF = ({ title, subtitle, orgName, columns, rows, filename }: PDFOptions) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(title, 14, 22);
  
  if (orgName) {
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(orgName, 14, 30);
  }
  
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(subtitle, 14, orgName ? 36 : 30);
  }

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, orgName && subtitle ? 42 : orgName || subtitle ? 36 : 30);

  // Table
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: orgName && subtitle ? 48 : orgName || subtitle ? 42 : 36,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
    doc.text("ZainBook AI - Property Management Platform", 14, doc.internal.pageSize.height - 10);
  }

  doc.save(filename);
};

export const generateInvoicePDF = (invoice: any, orgName: string) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(40, 40, 40);
  doc.text("INVOICE", 14, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(orgName, 14, 33);
  doc.text(`Invoice #: ${invoice.invoice_number}`, 14, 40);
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 14, 46);
  doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 14, 52);

  // Status
  doc.setFontSize(12);
  doc.setTextColor(invoice.status === "paid" ? 34 : 220, invoice.status === "paid" ? 139 : 38, invoice.status === "paid" ? 34 : 38);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 140, 25);
  
  // Tenant info
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text("Bill To:", 14, 66);
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(invoice.tenants?.full_name || "—", 14, 73);

  // Line items
  autoTable(doc, {
    head: [["Description", "Amount (AED)", "VAT 5% (AED)", "Total (AED)"]],
    body: [
      [
        invoice.description || "Rent Payment",
        Number(invoice.amount).toLocaleString(),
        Number(invoice.vat_amount).toLocaleString(),
        Number(invoice.total_amount).toLocaleString(),
      ],
    ],
    startY: 82,
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    margin: { left: 14, right: 14 },
  });

  // Totals
  const finalY = (doc as any).lastAutoTable?.finalY || 110;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Subtotal: AED ${Number(invoice.amount).toLocaleString()}`, 130, finalY + 12);
  doc.text(`VAT (5%): AED ${Number(invoice.vat_amount).toLocaleString()}`, 130, finalY + 19);
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text(`Total: AED ${Number(invoice.total_amount).toLocaleString()}`, 130, finalY + 28);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("ZainBook AI - Property Management Platform", 14, doc.internal.pageSize.height - 10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 130, doc.internal.pageSize.height - 10);

  doc.save(`invoice-${invoice.invoice_number}.pdf`);
};

export const generateEjariPDF = (contract: any, orgName: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text("EJARI CONTRACT", 14, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(orgName, 14, 33);
  doc.text(`Ejari #: ${contract.ejari_number}`, 14, 40);
  if (contract.contract_number) doc.text(`Contract #: ${contract.contract_number}`, 14, 46);
  
  // Status badge
  doc.setFontSize(12);
  const statusColor = contract.status === "registered" ? [34, 139, 34] : contract.status === "expired" ? [220, 38, 38] : [100, 100, 100];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(`Status: ${(contract.status || "draft").toUpperCase()}`, 140, 25);

  // Details table
  autoTable(doc, {
    head: [["Field", "Details"]],
    body: [
      ["Tenant", contract.tenants?.full_name || "—"],
      ["Property", contract.property_name || "—"],
      ["Unit", contract.unit_number || "—"],
      ["Start Date", contract.start_date ? new Date(contract.start_date).toLocaleDateString() : "—"],
      ["End Date", contract.end_date ? new Date(contract.end_date).toLocaleDateString() : "—"],
      ["Annual Rent", `AED ${Number(contract.annual_rent).toLocaleString()}`],
      ["Security Deposit", `AED ${Number(contract.security_deposit || 0).toLocaleString()}`],
      ["Contract Type", (contract.contract_type || "new").charAt(0).toUpperCase() + (contract.contract_type || "new").slice(1)],
      ["Payment Method", (contract.payment_method || "cheque").replace("_", " ")],
      ["Registration Date", contract.registration_date ? new Date(contract.registration_date).toLocaleDateString() : "—"],
      ["Expiry Date", contract.expiry_date ? new Date(contract.expiry_date).toLocaleDateString() : "—"],
    ],
    startY: 54,
    styles: { fontSize: 10, cellPadding: 5 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
    margin: { left: 14, right: 14 },
  });

  if (contract.notes) {
    const finalY = (doc as any).lastAutoTable?.finalY || 180;
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text("Notes:", 14, finalY + 10);
    doc.setFontSize(9);
    doc.text(contract.notes, 14, finalY + 17, { maxWidth: 180 });
  }

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("ZainBook AI - Property Management Platform", 14, doc.internal.pageSize.height - 10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 130, doc.internal.pageSize.height - 10);

  doc.save(`ejari-${contract.ejari_number}.pdf`);
};
