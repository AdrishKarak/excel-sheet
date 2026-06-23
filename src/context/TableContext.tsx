import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { TableMetadata, TableColumn, TableRow, ColumnType } from '../types';
import { 
  createTable as dbCreateTable,
  getUserTables,
  deleteTable as dbDeleteTable,
  duplicateTable as dbDuplicateTable,
  updateTableMetadata,
  getTableColumns,
  getTableRows,
  addTableColumn,
  updateTableColumn,
  deleteTableColumn,
  addTableRow as dbAddTableRow,
  updateTableRow as dbUpdateTableRow,
  deleteTableRow as dbDeleteTableRow,
  bulkDeleteRows as dbBulkDeleteRows,
  generateId
} from '../firebase/db';
import { toast } from 'react-hot-toast';

// Secure wrapped storage container safe for sandboxed third-party iframe environments
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("Storage access blocked by browser options or iframe sandbox:", e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage write blocked by browser options or iframe sandbox:", e);
    }
  }
};

interface FilterRule {
  columnId: string;
  condition: 'contains' | 'equals' | 'greaterThan' | 'lessThan' | 'empty' | 'notEmpty';
  value: string;
}

interface TableContextType {
  tables: TableMetadata[];
  activeTable: TableMetadata | null;
  columns: TableColumn[];
  rows: TableRow[];
  loadingTables: boolean;
  loadingData: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortColumnId: string | null;
  sortDirection: 'asc' | 'desc' | null;
  setSort: (columnId: string | null, direction: 'asc' | 'desc' | null) => void;
  filters: FilterRule[];
  addFilter: (filter: FilterRule) => void;
  removeFilter: (index: number) => void;
  clearFilters: () => void;
  selectedRowIds: Set<string>;
  toggleSelectRow: (rowId: string) => void;
  toggleSelectAllRows: () => void;
  recentTables: TableMetadata[];
  
  // Table operations
  createNewTable: (name: string, template?: 'empty' | 'student' | 'expense' | 'inventory') => Promise<string>;
  selectTable: (tableId: string) => Promise<void>;
  renameActiveTable: (newName: string) => Promise<void>;
  removeActiveTable: () => Promise<void>;
  cloneTable: (tableId: string) => Promise<void>;
  toggleFavoriteTable: (tableId: string) => Promise<void>;
  
  // Column operations
  addColumn: (name: string, type: ColumnType, options?: string[], customId?: string) => Promise<string>;
  renameColumn: (columnId: string, newName: string) => Promise<void>;
  changeColumnType: (columnId: string, newType: ColumnType, options?: string[]) => Promise<void>;
  removeColumn: (columnId: string) => Promise<void>;
  reorderColumns: (reordered: TableColumn[]) => void; // State reordering helper
  
  // Row operations
  addRow: (initialCells?: Record<string, any>) => Promise<void>;
  editCell: (rowId: string, columnId: string, value: any) => Promise<void>;
  removeRow: (rowId: string) => Promise<void>;
  removeSelectedRows: () => Promise<void>;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export function TableProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [tables, setTables] = useState<TableMetadata[]>([]);
  const [activeTable, setActiveTable] = useState<TableMetadata | null>(null);
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [rows, setRows] = useState<TableRow[]>([]);
  
  const [loadingTables, setLoadingTables] = useState<boolean>(true);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortColumnId, setSortColumnId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [recentTableIds, setRecentTableIds] = useState<string[]>([]);

  // Local Undo / Redo History stack for Cells state
  const [undoStack, setUndoStack] = useState<Record<string, any>[][]>([]);
  const [redoStack, setRedoStack] = useState<Record<string, any>[][]>([]);

  // Load user tables
  const loadTables = async () => {
    if (!currentUser) {
      setTables([]);
      setActiveTable(null);
      setLoadingTables(false);
      return;
    }
    try {
      setLoadingTables(true);
      const data = await getUserTables(currentUser.uid);
      setTables(data);
      if (data.length > 0 && !activeTable) {
        // Auto select first table
        await selectCurrentTable(data[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tables from database.");
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, [currentUser]);

  // Handle Recent Tables list from LocalStorage
  useEffect(() => {
    const stored = safeLocalStorage.getItem('recent_tables');
    if (stored) {
      try {
        setRecentTableIds(JSON.parse(stored) as string[]);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const selectCurrentTable = async (table: TableMetadata) => {
    setActiveTable(table);
    setLoadingData(true);
    setSearchQuery('');
    setSortColumnId(null);
    setSortDirection(null);
    setFilters([]);
    setSelectedRowIds(new Set());
    setUndoStack([]);
    setRedoStack([]);
    
    try {
      const [colsData, rowsData] = await Promise.all([
        getTableColumns(table.id),
        getTableRows(table.id)
      ]);
      setColumns(colsData);
      setRows(rowsData);

      // Track recents
      setRecentTableIds((prev) => {
        const next = [table.id, ...prev.filter(id => id !== table.id)].slice(0, 5);
        safeLocalStorage.setItem('recent_tables', JSON.stringify(next));
        return next;
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load table content.");
    } finally {
      setLoadingData(false);
    }
  };

  const createNewTable = async (name: string, template: 'empty' | 'student' | 'expense' | 'inventory' = 'empty') => {
    if (!currentUser) throw new Error("Authentication required");
    try {
      const newId = await dbCreateTable(currentUser.uid, name, template);
      await loadTables();
      const newTable = tables.find(t => t.id === newId) || {
        id: newId,
        name,
        createdBy: currentUser.uid,
        createdAt: Date.now(),
        lastUpdated: Date.now()
      };
      await selectCurrentTable(newTable as TableMetadata);
      toast.success(`Successfully created table "${name}"`);
      return newId;
    } catch (err) {
      console.error(err);
      toast.error("Failed to create table.");
      throw err;
    }
  };

  const selectTable = async (tableId: string) => {
    const target = tables.find(t => t.id === tableId);
    if (target) {
      await selectCurrentTable(target);
    }
  };

  const renameActiveTable = async (newName: string) => {
    if (!activeTable) return;
    try {
      await updateTableMetadata(activeTable.id, { name: newName });
      setActiveTable(prev => prev ? { ...prev, name: newName } : null);
      setTables(prev => prev.map(t => t.id === activeTable.id ? { ...t, name: newName } : t));
      toast.success("Table renamed.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to rename table.");
    }
  };

  const removeActiveTable = async () => {
    if (!activeTable) return;
    try {
      await dbDeleteTable(activeTable.id);
      const remaining = tables.filter(t => t.id !== activeTable.id);
      setTables(remaining);
      setActiveTable(null);
      if (remaining.length > 0) {
        await selectCurrentTable(remaining[0]);
      } else {
        setColumns([]);
        setRows([]);
      }
      toast.success("Table deleted permanently.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete table.");
    }
  };

  const cloneTable = async (tableId: string) => {
    if (!currentUser) return;
    const target = tables.find(t => t.id === tableId);
    if (!target) return;
    try {
      const clonedId = await dbDuplicateTable(currentUser.uid, target);
      await loadTables();
      await selectTable(clonedId);
      toast.success(`Duplicated "${target.name}" successfully!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to duplicate table.");
    }
  };

  const toggleFavoriteTable = async (tableId: string) => {
    const target = tables.find(t => t.id === tableId);
    if (!target) return;
    const nextVal = !target.isFavorite;
    try {
      await updateTableMetadata(tableId, { isFavorite: nextVal });
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, isFavorite: nextVal } : t));
      if (activeTable && activeTable.id === tableId) {
        setActiveTable(prev => prev ? { ...prev, isFavorite: nextVal } : null);
      }
      toast.success(nextVal ? "Added to Favorites" : "Removed from Favorites");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    }
  };

  // Helper for Undo/Redo - Snapshot of current cells state
  const pushToUndo = (currentRows: TableRow[]) => {
    const snapshot = currentRows.map(r => ({ id: r.id, cells: { ...r.cells } }));
    setUndoStack(prev => [...prev, snapshot].slice(-20)); // Limit to 20 history steps
    setRedoStack([]); // Clear redo stack on new progressive actions
  };

  // COLUMN OPERATIONS
  const addColumn = async (name: string, type: ColumnType, options?: string[], customId?: string): Promise<string> => {
    if (!activeTable) return '';
    const colId = customId || `col_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCol: TableColumn = {
      id: colId,
      name,
      type,
      options,
      createdAt: Date.now(),
      order: columns.length > 0 ? Math.max(...columns.map(c => c.order)) + 1 : 0
    };

    try {
      await addTableColumn(activeTable.id, newCol);
      setColumns(prev => [...prev, newCol]);
      
      // Default cell initialization for checkbox type as false in local state
      if (type === 'checkbox') {
        const updatedRows = rows.map(r => ({
          ...r,
          cells: { ...r.cells, [colId]: false }
        }));
        setRows(updatedRows);
      }

      toast.success(`Column "${name}" added.`);
      return colId;
    } catch (err) {
      console.error(err);
      toast.error("Failed to add column.");
      throw err;
    }
  };

  const renameColumn = async (columnId: string, newName: string) => {
    if (!activeTable) return;
    try {
      await updateTableColumn(activeTable.id, columnId, { name: newName });
      setColumns(prev => prev.map(c => c.id === columnId ? { ...c, name: newName } : c));
      toast.success("Column renamed.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to rename column.");
    }
  };

  const changeColumnType = async (columnId: string, newType: ColumnType, options?: string[]) => {
    if (!activeTable) return;
    try {
      await updateTableColumn(activeTable.id, columnId, { type: newType, options });
      setColumns(prev => prev.map(c => c.id === columnId ? { ...c, type: newType, options } : c));
      
      // Normalize existing cells values to fit new column type if needed
      pushToUndo(rows);
      const updatedRows = rows.map(row => {
        const val = row.cells[columnId];
        let newVal = val;
        
        if (newType === 'checkbox') {
          newVal = !!val;
        } else if (newType === 'number') {
          newVal = isNaN(Number(val)) ? 0 : Number(val);
        } else if (newType === 'text') {
          newVal = val === undefined || val === null ? '' : String(val);
        }

        return {
          ...row,
          cells: { ...row.cells, [columnId]: newVal }
        };
      });

      setRows(updatedRows);
      // Save conversions to DB
      await Promise.all(updatedRows.map(row => dbUpdateTableRow(activeTable.id, row.id, row.cells)));

      toast.success("Column type changed & values normalized.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update column type.");
    }
  };

  const removeColumn = async (columnId: string) => {
    if (!activeTable) return;
    try {
      await deleteTableColumn(activeTable.id, columnId);
      setColumns(prev => prev.filter(c => c.id !== columnId));
      setRows(prev => prev.map(r => {
        const nextCells = { ...r.cells };
        delete nextCells[columnId];
        return { ...r, cells: nextCells };
      }));
      toast.success("Column deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete column.");
    }
  };

  const reorderColumns = (reordered: TableColumn[]) => {
    setColumns(reordered);
    // Write orders sequentially to Firebase
    if (activeTable) {
      reordered.forEach((col, idx) => {
        updateTableColumn(activeTable.id, col.id, { order: idx });
      });
    }
  };

  // ROW OPERATIONS
  const addRow = async (initialCells: Record<string, any> = {}) => {
    if (!activeTable) return;
    try {
      // Setup dynamic default values (e.g. checkbox -> false)
      columns.forEach(col => {
        if (col.type === 'checkbox' && initialCells[col.id] === undefined) {
          initialCells[col.id] = false;
        }
      });

      const newRow = await dbAddTableRow(activeTable.id, initialCells);
      setRows(prev => [...prev, newRow]);
      toast.success("Row added.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to insert row.");
    }
  };

  const editCell = async (rowId: string, columnId: string, value: any) => {
    if (!activeTable) return;
    
    // Optimistic Save with local undo
    pushToUndo(rows);

    const oldRows = [...rows];
    const targetRow = rows.find(r => r.id === rowId);
    if (!targetRow) return;

    const nextCells = { ...targetRow.cells, [columnId]: value };
    const nextRows = rows.map(r => r.id === rowId ? { ...r, cells: nextCells, updatedAt: Date.now() } : r);
    setRows(nextRows);

    try {
      await dbUpdateTableRow(activeTable.id, rowId, nextCells);
    } catch (err) {
      console.error(err);
      setRows(oldRows); // Revert on failure
      toast.error("Auto-save cell failed! Value reverted.");
    }
  };

  const removeRow = async (rowId: string) => {
    if (!activeTable) return;
    try {
      pushToUndo(rows);
      await dbDeleteTableRow(activeTable.id, rowId);
      setRows(prev => prev.filter(r => r.id !== rowId));
      setSelectedRowIds(prev => {
        const next = new Set(prev);
        next.delete(rowId);
        return next;
      });
      toast.success("Row deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete row.");
    }
  };

  const removeSelectedRows = async () => {
    if (!activeTable || selectedRowIds.size === 0) return;
    const idsToDelete = Array.from(selectedRowIds) as string[];
    try {
      pushToUndo(rows);
      await dbBulkDeleteRows(activeTable.id, idsToDelete);
      setRows(prev => prev.filter(r => !selectedRowIds.has(r.id)));
      setSelectedRowIds(new Set());
      toast.success(`Bulk deleted ${idsToDelete.length} rows.`);
    } catch (err) {
      console.error(err);
      toast.error("Bulk delete failed.");
    }
  };

  // MULTI SELECT CONTROL
  const toggleSelectRow = (rowId: string) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const toggleSelectAllRows = () => {
    setSelectedRowIds(prev => {
      if (prev.size === filteredAndSortedRows.length) {
        return new Set();
      } else {
        return new Set(filteredAndSortedRows.map(r => r.id));
      }
    });
  };

  // SORT & FILTER METHODS
  const setSort = (columnId: string | null, direction: 'asc' | 'desc' | null) => {
    setSortColumnId(columnId);
    setSortDirection(direction);
  };

  const addFilter = (filter: FilterRule) => {
    setFilters(prev => [...prev, filter]);
  };

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, idx) => idx !== index));
  };

  const clearFilters = () => {
    setFilters([]);
  };

  // UNDO & REDO CONTROLS
  const undo = () => {
    if (undoStack.length === 0 || !activeTable) return;
    const lastState = undoStack[undoStack.length - 1];
    const undoneRows = rows.map(r => {
      const hist = lastState.find(h => h.id === r.id);
      return hist ? { ...r, cells: { ...hist.cells } } : r;
    });

    const currentState = rows.map(r => ({ id: r.id, cells: { ...r.cells } }));
    setRedoStack(prev => [...prev, currentState]);
    setUndoStack(prev => prev.slice(0, -1));
    setRows(undoneRows);

    // Sync state in bulk in the DB
    Promise.all(undoneRows.map(r => dbUpdateTableRow(activeTable!.id, r.id, r.cells)))
      .then(() => toast.success("Action undone"))
      .catch((e) => console.error("Sync undo failed", e));
  };

  const redo = () => {
    if (redoStack.length === 0 || !activeTable) return;
    const nextState = redoStack[redoStack.length - 1];
    const redoneRows = rows.map(r => {
      const hist = nextState.find(h => h.id === r.id);
      return hist ? { ...r, cells: { ...hist.cells } } : r;
    });

    const currentState = rows.map(r => ({ id: r.id, cells: { ...r.cells } }));
    setUndoStack(prev => [...prev, currentState]);
    setRedoStack(prev => prev.slice(0, -1));
    setRows(redoneRows);

    // Sync state in bulk to Firebase
    Promise.all(redoneRows.map(r => dbUpdateTableRow(activeTable!.id, r.id, r.cells)))
      .then(() => toast.success("Action redone"))
      .catch((e) => console.error("Sync redo failed", e));
  };

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  // Process rows selector: matches search, filtering, and sorting safely
  const filteredAndSortedRows = useMemo(() => {
    let result = [...rows];

    // 1. Search Query Match
    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase();
      result = result.filter(row => {
        return Object.values(row.cells).some(val => {
          if (val === undefined || val === null) return false;
          return String(val).toLowerCase().includes(queryLower);
        });
      });
    }

    // 2. Custom Filter Rules
    filters.forEach(rule => {
      const { columnId, condition, value } = rule;
      const lowerRuleVal = value.toLowerCase();

      result = result.filter(row => {
        const recordVal = row.cells[columnId];
        const strVal = recordVal !== undefined && recordVal !== null ? String(recordVal) : '';
        const numVal = Number(recordVal);

        switch (condition) {
          case 'contains':
            return strVal.toLowerCase().includes(lowerRuleVal);
          case 'equals':
            return strVal.toLowerCase() === lowerRuleVal;
          case 'greaterThan':
            return !isNaN(numVal) && numVal > Number(value);
          case 'lessThan':
            return !isNaN(numVal) && numVal < Number(value);
          case 'empty':
            return strVal === '' || recordVal === false;
          case 'notEmpty':
            return strVal !== '' && recordVal !== false;
          default:
            return true;
        }
      });
    });

    // 3. Sorting Execution
    if (sortColumnId && sortDirection) {
      result.sort((a, b) => {
        const valA = a.cells[sortColumnId];
        const valB = b.cells[sortColumnId];

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        // Custom comparisons based on types
        const colType = columns.find(c => c.id === sortColumnId)?.type;
        if (colType === 'number') {
          return sortDirection === 'asc' 
            ? Number(valA) - Number(valB) 
            : Number(valB) - Number(valA);
        } else if (colType === 'checkbox') {
          const bitA = valA ? 1 : 0;
          const bitB = valB ? 1 : 0;
          return sortDirection === 'asc' ? bitA - bitB : bitB - bitA;
        } else {
          return sortDirection === 'asc'
            ? String(valA).localeCompare(String(valB))
            : String(valB).localeCompare(String(valA));
        }
      });
    }

    return result;
  }, [rows, searchQuery, filters, sortColumnId, sortDirection, columns]);

  // Compute Recent Tables Objects
  const recentTables = useMemo(() => {
    return recentTableIds
      .map(id => tables.find(t => t.id === id))
      .filter((t): t is TableMetadata => !!t);
  }, [recentTableIds, tables]);

  return (
    <TableContext.Provider value={{
      tables,
      activeTable,
      columns,
      rows: filteredAndSortedRows, // Yield processed rows dynamically
      loadingTables,
      loadingData,
      searchQuery,
      setSearchQuery,
      sortColumnId,
      sortDirection,
      setSort,
      filters,
      addFilter,
      removeFilter,
      clearFilters,
      selectedRowIds,
      toggleSelectRow,
      toggleSelectAllRows,
      recentTables,

      createNewTable,
      selectTable,
      renameActiveTable,
      removeActiveTable,
      cloneTable,
      toggleFavoriteTable,

      addColumn,
      renameColumn,
      changeColumnType,
      removeColumn,
      reorderColumns,

      addRow,
      editCell,
      removeRow,
      removeSelectedRows,

      undo,
      redo,
      canUndo,
      canRedo
    }}>
      {children}
    </TableContext.Provider>
  );
}

export function useTable() {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error('useTable must be used within a TableProvider');
  }
  return context;
}
