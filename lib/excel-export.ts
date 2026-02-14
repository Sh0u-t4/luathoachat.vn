import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

interface ExcelExportOptions {
  filename: string;
  sheetName: string;
  columns: ExcelColumn[];
  data: any[];
  title?: string;
  subtitle?: string;
}

/**
 * Export data to Excel with professional formatting
 */
export function exportToExcel({
  filename,
  sheetName,
  columns,
  data,
  title,
  subtitle,
}: ExcelExportOptions) {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Prepare headers
  const headers = columns.map(col => col.header);

  // Prepare data rows
  const rows = data.map(item =>
    columns.map(col => {
      const value = item[col.key];

      // Format dates
      if (value instanceof Date) {
        return format(value, 'dd/MM/yyyy HH:mm');
      }

      // Handle arrays
      if (Array.isArray(value)) {
        return value.join(', ');
      }

      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }

      return value;
    })
  );

  // Combine headers and data
  const wsData = [headers, ...rows];

  // Add title and subtitle if provided
  if (title || subtitle) {
    const titleRows = [];
    if (title) {
      titleRows.push([title]);
      titleRows.push([]); // Empty row
    }
    if (subtitle) {
      titleRows.push([subtitle]);
      titleRows.push([]); // Empty row
    }
    wsData.unshift(...titleRows);
  }

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const colWidths = columns.map(col => ({
    wch: col.width || 15, // Default width 15 characters
  }));
  ws['!cols'] = colWidths;

  // Apply header styling (bold text for header row)
  const headerRowIndex = (title || subtitle) ? (title ? 2 : 0) + (subtitle ? 2 : 0) : 0;
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
    if (!ws[cellAddress]) continue;

    // Bold header
    ws[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "E2E8F0" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate file
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  const fullFilename = `${filename}_${timestamp}.xlsx`;

  // Write file
  XLSX.writeFile(wb, fullFilename);
}

/**
 * Quick export function for simple data tables
 */
export function quickExportToExcel(
  data: any[],
  filename: string,
  sheetName: string = 'Sheet1'
) {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Auto-detect columns from first row
  const firstRow = data[0];
  const columns: ExcelColumn[] = Object.keys(firstRow).map(key => ({
    header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
    key,
    width: 15,
  }));

  exportToExcel({
    filename,
    sheetName,
    columns,
    data,
  });
}
