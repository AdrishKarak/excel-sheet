import React, { useRef, useState } from 'react';
import { Download, Upload, Info, AlertCircle } from 'lucide-react';
import { useTable } from '../context/TableContext';
import { toast } from 'react-hot-toast';

export default function CSVExportImport() {
  const { activeTable, columns, rows, addRow, addColumn } = useTable();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!activeTable) return null;

  // 1. Export CSV
  const handleExport = () => {
    if (columns.length === 0) {
      toast.error("Table has no columns to export!");
      return;
    }

    try {
      // CSV Headers
      const headers = columns.map(c => `"${c.name.replace(/"/g, '""')}"`);
      
      // CSV Rows
      const csvLines = rows.map(row => {
        return columns.map(col => {
          const val = row.cells[col.id];
          if (val === undefined || val === null) return '""';
          if (typeof val === 'boolean') return val ? '"true"' : '"false"';
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',');
      });

      const csvContent = [headers.join(','), ...csvLines].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${activeTable.name.replace(/\s+/g, '_')}_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV file exported successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate CSV export file.");
    }
  };

  // Helper: Simple CSV parser that handles quotes and commas
  const parseCSV = (text: string): string[][] => {
    const result: string[][] = [];
    let row: string[] = [''];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          row[row.length - 1] += '"';
          i++; // Skip double quote value double-escape
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push('');
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip CRLF split
        }
        result.push(row);
        row = [''];
      } else {
        row[row.length - 1] += char;
      }
    }
    if (row.length > 0 && row[0] !== '') {
      result.push(row);
    }
    return result;
  };

  // 2. Import CSV Processing
  const handleCSVImport = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error("Please upload a valid CSV file (.csv)");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) {
        toast.error("Empty CSV file!");
        return;
      }

      try {
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          toast.error("Unable to parse CSV records.");
          return;
        }

        const headers = parsed[0].map(h => h.trim());
        const dataRows = parsed.slice(1);

        if (headers.length === 0 || dataRows.length === 0) {
          toast.error("CSV has no records or columns.");
          return;
        }

        toast.loading("Preparing column mappings...", { id: 'csv-import' });

        // Map parsed headers to current columns
        const currentColumnsMap = new Map<string, string>(); // Column Name -> Column ID
        columns.forEach(col => {
          currentColumnsMap.set(col.name.toLowerCase().trim(), col.id);
        });

        const targetColumnIds: string[] = [];

        // For each parsed header, look up or create
        for (let idx = 0; idx < headers.length; idx++) {
          const rawHeaderName = headers[idx] || `Header ${idx + 1}`;
          const normalizedName = rawHeaderName.toLowerCase().trim();
          let colId = currentColumnsMap.get(normalizedName);

          if (!colId) {
            // Column does not exist, dynamic addition
            const customColId = `col_${Date.now()}_import_${idx}`;
            colId = await addColumn(rawHeaderName, 'text', undefined, customColId);
            currentColumnsMap.set(normalizedName, colId);
          }
          targetColumnIds.push(colId);
        }

        toast.loading(`Importing ${dataRows.length} rows...`, { id: 'csv-import' });

        // Insert rows
        let successCount = 0;
        for (const rawRow of dataRows) {
          // Skip empty trailing rows
          if (rawRow.length === 1 && rawRow[0] === '') continue;

          const rowCells: Record<string, any> = {};
          targetColumnIds.forEach((colId, headerIdx) => {
            const rawVal = rawRow[headerIdx] || '';
            rowCells[colId] = rawVal;
          });

          await addRow(rowCells);
          successCount++;
        }

        toast.success(`Successfully imported ${successCount} entries!`, { id: 'csv-import' });
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error(err);
        toast.error("Internal failure during CSV parsing.", { id: 'csv-import' });
      }
    };
    reader.readAsText(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleCSVImport(files[0]);
    }
  };

  return (
    <div id="csv-export-import-panel" className="flex items-center gap-2">
      <input 
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleCSVImport(e.target.files[0]);
          }
        }}
        accept=".csv"
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1 py-1 px-2 border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-[11px] font-medium cursor-pointer transition-all shadow-xs"
        title="Import CSV File"
      >
        <Upload className="w-3.5 h-3.5" />
        <span>Import CSV</span>
      </button>

      <button
        onClick={handleExport}
        className="flex items-center gap-1 py-1 px-2 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg text-[11px] font-medium cursor-pointer transition-all shadow-xs"
        title="Export CSV File"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Export CSV</span>
      </button>
    </div>
  );
}
