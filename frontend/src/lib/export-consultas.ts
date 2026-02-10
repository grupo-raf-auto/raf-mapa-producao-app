import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

/** Submission row as used in admin consultas table (minimal shape for export). */
export interface ConsultasExportRow {
  templateTitle?: string;
  agentName?: string | null;
  nomeClienteAnswer?: string | null;
  bancoAnswer?: string | null;
  seguradoraAnswer?: string | null;
  valorAnswer?: string | null;
  formDate?: string | null;
  submittedAt: Date | string;
  commissionPaid?: boolean;
}

const CSV_SEP = ';';
const CSV_QUOTE = '"';
const UTF8_BOM = '\uFEFF';

function formatDate(value: string | Date | null | undefined): string {
  if (value == null || value === '') return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatCurrency(value: string | null | undefined): string {
  if (value == null || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escapeCsvCell(value: string): string {
  const str = String(value ?? '').trim();
  const needsQuotes = /[;\r\n"]/.test(str) || str.includes(CSV_QUOTE);
  if (!needsQuotes) return str;
  return CSV_QUOTE + str.replace(new RegExp(CSV_QUOTE, 'g'), CSV_QUOTE + CSV_QUOTE) + CSV_QUOTE;
}

/**
 * Build CSV content (UTF-8 with BOM for Excel). Uses semicolon as separator for pt-PT.
 */
function buildCsv(rows: ConsultasExportRow[]): string {
  const headers = [
    'Template',
    'Agente',
    'Nome do Cliente',
    'Banco',
    'Seguradora',
    'Valor',
    'Data',
    'Comissão paga',
  ];
  const lines: string[] = [headers.map(escapeCsvCell).join(CSV_SEP)];

  for (const row of rows) {
    const dateStr = formatDate(row.formDate ?? row.submittedAt);
    const valorStr = formatCurrency(row.valorAnswer);
    const comissaoStr = row.commissionPaid === true ? 'Sim' : row.commissionPaid === false ? 'Não' : '';

    const cells = [
      row.templateTitle ?? '',
      row.agentName ?? '',
      row.nomeClienteAnswer ?? '',
      row.bancoAnswer ?? '',
      row.seguradoraAnswer ?? '',
      valorStr,
      dateStr,
      comissaoStr,
    ];
    lines.push(cells.map(escapeCsvCell).join(CSV_SEP));
  }

  return UTF8_BOM + lines.join('\r\n');
}

/**
 * Trigger download of a string as a file.
 */
function downloadBlob(content: string | Blob, filename: string, mimeType: string): void {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export filtered consultas to CSV (current list only). Professional filename with date.
 */
export function exportConsultasToCsv(rows: ConsultasExportRow[]): void {
  const csv = buildCsv(rows);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `consultas-grupo-raf_${date}.csv`;
  downloadBlob(csv, filename, 'text/csv;charset=utf-8');
}

/**
 * Export filtered consultas to PDF (current list only). Table layout with title and date.
 */
export function exportConsultasToPdf(rows: ConsultasExportRow[]): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.getPageWidth();
  const margin = 10;

  doc.setFontSize(14);
  doc.text('Consultas – Grupo RAF', margin, 12);
  doc.setFontSize(9);
  doc.text(`Exportado em ${formatDate(new Date())} – ${rows.length} registo(s)`, margin, 18);

  const head = [
    'Template',
    'Agente',
    'Nome do Cliente',
    'Banco',
    'Seguradora',
    'Valor',
    'Data',
    'Com. paga',
  ];
  const body = rows.map((row) => {
    const dateStr = formatDate(row.formDate ?? row.submittedAt);
    const valorStr = formatCurrency(row.valorAnswer);
    const comissaoStr = row.commissionPaid === true ? 'Sim' : row.commissionPaid === false ? 'Não' : '-';
    return [
      (row.templateTitle ?? '-').slice(0, 25),
      (row.agentName ?? '-').slice(0, 20),
      (row.nomeClienteAnswer ?? '-').slice(0, 22),
      (row.bancoAnswer ?? '-').slice(0, 18),
      (row.seguradoraAnswer ?? '-').slice(0, 18),
      valorStr,
      dateStr,
      comissaoStr,
    ];
  });

  autoTable(doc, {
    head: [head],
    body,
    startY: 22,
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - margin * 2,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [66, 66, 66], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 248, 248] },
  });

  const date = new Date().toISOString().slice(0, 10);
  const filename = `consultas-grupo-raf_${date}.pdf`;
  doc.save(filename);
}
