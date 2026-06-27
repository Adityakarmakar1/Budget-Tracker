import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Transaction } from './types';
import type { BudgetStatus } from './analytics';
import { formatCurrency, currencySymbol } from './format';
import { monthLabel } from './format';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/*  Transactions — CSV                                                 */
/* ------------------------------------------------------------------ */

export function exportTransactionsCsv(transactions: Transaction[], monthKeyStr?: string) {
  const header = ['Date', 'Type', 'Category', 'Description', 'Amount'];
  const rows = transactions.map((t) => [
    t.date,
    t.type,
    t.category,
    t.description,
    t.amount.toFixed(2),
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((c) => escapeCsv(String(c))).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const suffix = monthKeyStr ? `-${monthKeyStr}` : '';
  triggerDownload(blob, `finflow-transactions${suffix}-${todayStamp()}.csv`);
}

/* ------------------------------------------------------------------ */
/*  Transactions — PDF                                                 */
/* ------------------------------------------------------------------ */

export function exportTransactionsPdf(transactions: Transaction[], monthKeyStr?: string) {
  const doc = new jsPDF();
  const period = monthKeyStr ? monthLabel(monthKeyStr) : 'All time';

  // Title
  doc.setFontSize(20);
  doc.setTextColor(99, 102, 241);
  doc.text('Finflow', 14, 18);
  doc.setFontSize(13);
  doc.setTextColor(60, 60, 60);
  doc.text('Transactions Report', 14, 26);
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Period: ${period}`, 14, 32);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 37);

  // Summary
  const income = transactions.filter((t) => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text(
    `Income: ${formatCurrency(income)}    Expense: ${formatCurrency(expense)}    Net: ${formatCurrency(income - expense, { sign: true })}`,
    14,
    45,
  );

  const body = transactions.map((t) => [
    new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    t.type.charAt(0).toUpperCase() + t.type.slice(1),
    t.category,
    t.description,
    `${t.type === 'income' ? '+' : '-'}${currencySymbol()}${t.amount.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 52,
    head: [['Date', 'Type', 'Category', 'Description', 'Amount']],
    body: body.length ? body : [['—', '—', 'No transactions', '—', '—']],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 10 },
    bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
    alternateRowStyles: { fillColor: [245, 246, 252] },
    columnStyles: {
      4: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  const suffix = monthKeyStr ? `-${monthKeyStr}` : '';
  doc.save(`finflow-transactions${suffix}-${todayStamp()}.pdf`);
}

/* ------------------------------------------------------------------ */
/*  Budgets — CSV                                                      */
/* ------------------------------------------------------------------ */

export function exportBudgetsCsv(statuses: BudgetStatus[], monthKeyStr?: string) {
  const header = ['Category', 'Budget Limit', 'Spent', 'Remaining', 'Used %', 'Status'];
  const rows = statuses.map((b) => [
    b.category,
    b.limit.toFixed(2),
    b.spent.toFixed(2),
    b.remaining.toFixed(2),
    `${(b.pct * 100).toFixed(0)}%`,
    b.over ? 'Over budget' : 'On track',
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((c) => escapeCsv(String(c))).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const suffix = monthKeyStr ? `-${monthKeyStr}` : '';
  triggerDownload(blob, `finflow-budgets${suffix}-${todayStamp()}.csv`);
}

/* ------------------------------------------------------------------ */
/*  Budgets — PDF                                                      */
/* ------------------------------------------------------------------ */

export function exportBudgetsPdf(statuses: BudgetStatus[], monthKeyStr?: string) {
  const doc = new jsPDF();
  const period = monthKeyStr ? monthLabel(monthKeyStr) : 'Current month';

  doc.setFontSize(20);
  doc.setTextColor(99, 102, 241);
  doc.text('Finflow', 14, 18);
  doc.setFontSize(13);
  doc.setTextColor(60, 60, 60);
  doc.text('Budgets Report', 14, 26);
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Period: ${period}`, 14, 32);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 37);

  const totalLimit = statuses.reduce((a, b) => a + b.limit, 0);
  const totalSpent = statuses.reduce((a, b) => a + b.spent, 0);
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text(
    `Total Budget: ${formatCurrency(totalLimit)}    Total Spent: ${formatCurrency(totalSpent)}    Remaining: ${formatCurrency(totalLimit - totalSpent, { sign: true })}`,
    14,
    45,
  );

  const body = statuses.map((b) => [
    b.category,
    `${currencySymbol()}${b.limit.toFixed(2)}`,
    `${currencySymbol()}${b.spent.toFixed(2)}`,
    `${b.remaining >= 0 ? currencySymbol() : '-' + currencySymbol()}${Math.abs(b.remaining).toFixed(2)}`,
    `${(b.pct * 100).toFixed(0)}%`,
    b.over ? 'Over budget' : 'On track',
  ]);

  autoTable(doc, {
    startY: 52,
    head: [['Category', 'Limit', 'Spent', 'Remaining', 'Used', 'Status']],
    body: body.length ? body : [['—', '—', 'No budgets set', '—', '—', '—']],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 10 },
    bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
    alternateRowStyles: { fillColor: [245, 246, 252] },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const text = String(data.cell.raw);
        if (text === 'Over budget') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [22, 163, 74];
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  const suffix = monthKeyStr ? `-${monthKeyStr}` : '';
  doc.save(`finflow-budgets${suffix}-${todayStamp()}.pdf`);
}
