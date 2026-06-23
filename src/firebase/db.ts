import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  writeBatch, 
  FieldValue,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './config';
import { TableMetadata, TableColumn, TableRow, OperationType, FirestoreErrorInfo } from '../types';

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to generate IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 1. Tables Metadata operations
export async function createTable(userId: string, name: string, template: 'empty' | 'student' | 'expense' | 'inventory' = 'empty'): Promise<string> {
  const tableId = generateId();
  const tableRef = doc(db, 'tables', tableId);
  const now = Date.now();

  const metadata: TableMetadata = {
    id: tableId,
    name,
    createdBy: userId,
    createdAt: now,
    lastUpdated: now,
    isFavorite: false
  };

  try {
    await setDoc(tableRef, metadata);

    // Seed default columns based on template
    const columnsRef = collection(db, 'tables', tableId, 'columns');
    const rowsRef = collection(db, 'tables', tableId, 'rows');
    const batch = writeBatch(db);

    let columnsToCreate: Omit<TableColumn, 'createdAt'>[] = [];
    let rowsToCreate: Record<string, any>[] = [];

    if (template === 'student') {
      columnsToCreate = [
        { id: 'col_name', name: 'Student Name', type: 'text', order: 0 },
        { id: 'col_roll', name: 'Roll Number', type: 'number', order: 1 },
        { id: 'col_branch', name: 'Branch', type: 'dropdown', options: ['CSE', 'ECE', 'ME', 'CE', 'IT'], order: 2 },
        { id: 'col_cgpa', name: 'CGPA', type: 'number', order: 3 },
        { id: 'col_passed', name: 'Passed All Subjects', type: 'checkbox', order: 4 }
      ];
      rowsToCreate = [
        { col_name: 'Alex Rivera', col_roll: 101, col_branch: 'CSE', col_cgpa: 9.2, col_passed: true },
        { col_name: 'Benton Vance', col_roll: 102, col_branch: 'ECE', col_cgpa: 8.5, col_passed: true },
        { col_name: 'Cleo Drake', col_roll: 103, col_branch: 'ME', col_cgpa: 7.1, col_passed: false }
      ];
    } else if (template === 'expense') {
      columnsToCreate = [
        { id: 'col_item', name: 'Item Name', type: 'text', order: 0 },
        { id: 'col_cost', name: 'Cost ($)', type: 'number', order: 1 },
        { id: 'col_category', name: 'Category', type: 'dropdown', options: ['Meals', 'Travel', 'Lodging', 'Office Supplies', 'Software'], order: 2 },
        { id: 'col_date', name: 'Purchase Date', type: 'date', order: 3 },
        { id: 'col_reimbursed', name: 'Reimbursed', type: 'checkbox', order: 4 }
      ];
      rowsToCreate = [
        { col_item: 'Client Lunch', col_cost: 120.45, col_category: 'Meals', col_date: '2026-06-20', col_reimbursed: true },
        { col_item: 'Vite Pro License', col_cost: 49.00, col_category: 'Software', col_date: '2026-06-21', col_reimbursed: false },
        { col_item: 'Hotel Booking', col_cost: 350.00, col_category: 'Lodging', col_date: '2026-06-18', col_reimbursed: true }
      ];
    } else if (template === 'inventory') {
      columnsToCreate = [
        { id: 'col_product', name: 'Product Name', type: 'text', order: 0 },
        { id: 'col_quantity', name: 'Quantity', type: 'number', order: 1 },
        { id: 'col_supplier', name: 'Supplier Email', type: 'email', order: 2 },
        { id: 'col_phone', name: 'Supplier Phone', type: 'phone', order: 3 },
        { id: 'col_instock', name: 'In Stock', type: 'checkbox', order: 4 }
      ];
      rowsToCreate = [
        { col_product: 'Wireless Mouse', col_quantity: 45, col_supplier: 'logi@supplier.com', col_phone: '123-456-7890', col_instock: true },
        { col_product: 'Mechanical Keyboard', col_quantity: 20, col_supplier: 'keychron@supplier.com', col_phone: '555-0199-281', col_instock: true },
        { col_product: '4K Monitor', col_quantity: 0, col_supplier: 'dell@supplier.com', col_phone: '800-444-1122', col_instock: false }
      ];
    } else {
      // Default Empty Template with 3 default columns to make editing friendly immediately
      columnsToCreate = [
        { id: 'col_name', name: 'Name', type: 'text', order: 0 },
        { id: 'col_notes', name: 'Notes', type: 'text', order: 1 },
        { id: 'col_status', name: 'Status', type: 'dropdown', options: ['Active', 'Pending', 'Inactive'], order: 2 }
      ];
      rowsToCreate = [
        { col_name: 'Sample Row 1', col_notes: 'Double-click cells to start inline editing!', col_status: 'Active' },
        { col_name: 'Sample Row 2', col_notes: 'Add headers and columns dynamically.', col_status: 'Pending' }
      ];
    }

    // Write columns
    columnsToCreate.forEach((col, idx) => {
      const colRef = doc(columnsRef, col.id);
      batch.set(colRef, {
        ...col,
        createdAt: now + idx
      });
    });

    // Write rows
    rowsToCreate.forEach((row, idx) => {
      const rowId = generateId();
      const rowRef = doc(rowsRef, rowId);
      batch.set(rowRef, {
        id: rowId,
        cells: row,
        createdAt: now + idx,
        updatedAt: now + idx
      });
    });

    await batch.commit();
    return tableId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `tables/${tableId}`);
    throw error;
  }
}

export async function getUserTables(userId: string): Promise<TableMetadata[]> {
  const tablesRef = collection(db, 'tables');
  const q = query(
    tablesRef, 
    where('createdBy', '==', userId), 
    orderBy('lastUpdated', 'desc')
  );
  
  try {
    const querySnapshot = await getDocs(q);
    const tables: TableMetadata[] = [];
    querySnapshot.forEach((doc) => {
      tables.push(doc.data() as TableMetadata);
    });
    return tables;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'tables');
    throw error;
  }
}

export async function updateTableMetadata(tableId: string, updates: Partial<TableMetadata>): Promise<void> {
  const tableRef = doc(db, 'tables', tableId);
  try {
    await updateDoc(tableRef, {
      ...updates,
      lastUpdated: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tables/${tableId}`);
    throw error;
  }
}

export async function deleteTable(tableId: string): Promise<void> {
  try {
    // First delete columns and rows
    const columnsRef = collection(db, 'tables', tableId, 'columns');
    const rowsRef = collection(db, 'tables', tableId, 'rows');

    const [colsSnapshot, rowsSnapshot] = await Promise.all([
      getDocs(columnsRef),
      getDocs(rowsRef)
    ]);

    const batch = writeBatch(db);

    colsSnapshot.forEach((colDoc) => {
      batch.delete(colDoc.ref);
    });

    rowsSnapshot.forEach((rowDoc) => {
      batch.delete(rowDoc.ref);
    });

    // Delete main table metadata doc
    batch.delete(doc(db, 'tables', tableId));

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `tables/${tableId}`);
    throw error;
  }
}

export async function duplicateTable(userId: string, originalTable: TableMetadata): Promise<string> {
  const newTableId = generateId();
  const now = Date.now();

  const newTableMetadata: TableMetadata = {
    id: newTableId,
    name: `${originalTable.name} (Copy)`,
    createdBy: userId,
    createdAt: now,
    lastUpdated: now,
    isFavorite: false,
    duplicateOf: originalTable.id
  };

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'tables', newTableId), newTableMetadata);

    // Fetch columns
    const origColsRef = collection(db, 'tables', originalTable.id, 'columns');
    const colsSnapshot = await getDocs(origColsRef);
    const newColsCollectionRef = collection(db, 'tables', newTableId, 'columns');

    colsSnapshot.forEach((colDoc) => {
      const colData = colDoc.data();
      batch.set(doc(newColsCollectionRef, colDoc.id), {
        ...colData,
        id: colDoc.id
      });
    });

    // Fetch rows
    const origRowsRef = collection(db, 'tables', originalTable.id, 'rows');
    const rowsSnapshot = await getDocs(origRowsRef);
    const newRowsCollectionRef = collection(db, 'tables', newTableId, 'rows');

    rowsSnapshot.forEach((rowDoc) => {
      const rowData = rowDoc.data();
      batch.set(doc(newRowsCollectionRef, rowDoc.id), {
        ...rowData,
        id: rowDoc.id
      });
    });

    await batch.commit();
    return newTableId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `tables/${newTableId}`);
    throw error;
  }
}

// 2. Columns subcollection operations
export async function getTableColumns(tableId: string): Promise<TableColumn[]> {
  const columnsRef = collection(db, 'tables', tableId, 'columns');
  const q = query(columnsRef, orderBy('order', 'asc'));
  try {
    const querySnapshot = await getDocs(q);
    const columns: TableColumn[] = [];
    querySnapshot.forEach((doc) => {
      columns.push(doc.data() as TableColumn);
    });
    return columns;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `tables/${tableId}/columns`);
    throw error;
  }
}

export async function addTableColumn(tableId: string, column: Omit<TableColumn, 'createdAt'>): Promise<void> {
  const colRef = doc(db, 'tables', tableId, 'columns', column.id);
  try {
    await setDoc(colRef, {
      ...column,
      createdAt: Date.now()
    });
    await updateTableMetadata(tableId, {});
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `tables/${tableId}/columns/${column.id}`);
    throw error;
  }
}

export async function updateTableColumn(tableId: string, columnId: string, updates: Partial<TableColumn>): Promise<void> {
  const colRef = doc(db, 'tables', tableId, 'columns', columnId);
  try {
    await updateDoc(colRef, updates);
    await updateTableMetadata(tableId, {});
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tables/${tableId}/columns/${columnId}`);
    throw error;
  }
}

export async function deleteTableColumn(tableId: string, columnId: string): Promise<void> {
  const colRef = doc(db, 'tables', tableId, 'columns', columnId);
  try {
    await deleteDoc(colRef);

    // Clean cell value from all rows as well in background/batch
    const rowsRef = collection(db, 'tables', tableId, 'rows');
    const rowsSnapshot = await getDocs(rowsRef);
    
    if (!rowsSnapshot.empty) {
      const batch = writeBatch(db);
      rowsSnapshot.forEach((rowDoc) => {
        const rowData = rowDoc.data();
        if (rowData.cells && rowData.cells[columnId] !== undefined) {
          const updatedCells = { ...rowData.cells };
          delete updatedCells[columnId];
          batch.update(rowDoc.ref, { cells: updatedCells, updatedAt: Date.now() });
        }
      });
      await batch.commit();
    }

    await updateTableMetadata(tableId, {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `tables/${tableId}/columns/${columnId}`);
    throw error;
  }
}

// 3. Rows subcollection operations
export async function getTableRows(tableId: string): Promise<TableRow[]> {
  const rowsRef = collection(db, 'tables', tableId, 'rows');
  const q = query(rowsRef, orderBy('createdAt', 'asc'));
  try {
    const querySnapshot = await getDocs(q);
    const rows: TableRow[] = [];
    querySnapshot.forEach((doc) => {
      rows.push(doc.data() as TableRow);
    });
    return rows;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `tables/${tableId}/rows`);
    throw error;
  }
}

export async function addTableRow(tableId: string, cells: Record<string, any> = {}): Promise<TableRow> {
  const rowId = generateId();
  const rowRef = doc(db, 'tables', tableId, 'rows', rowId);
  const now = Date.now();

  const newRow: TableRow = {
    id: rowId,
    cells,
    createdAt: now,
    updatedAt: now
  };

  try {
    await setDoc(rowRef, newRow);
    await updateTableMetadata(tableId, {});
    return newRow;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `tables/${tableId}/rows/${rowId}`);
    throw error;
  }
}

export async function updateTableRow(tableId: string, rowId: string, cells: Record<string, any>): Promise<void> {
  const rowRef = doc(db, 'tables', tableId, 'rows', rowId);
  try {
    await updateDoc(rowRef, {
      cells,
      updatedAt: Date.now()
    });
    await updateTableMetadata(tableId, {});
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tables/${tableId}/rows/${rowId}`);
    throw error;
  }
}

export async function deleteTableRow(tableId: string, rowId: string): Promise<void> {
  const rowRef = doc(db, 'tables', tableId, 'rows', rowId);
  try {
    await deleteDoc(rowRef);
    await updateTableMetadata(tableId, {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `tables/${tableId}/rows/${rowId}`);
    throw error;
  }
}

export async function bulkDeleteRows(tableId: string, rowIds: string[]): Promise<void> {
  if (rowIds.length === 0) return;
  try {
    const batch = writeBatch(db);
    rowIds.forEach((rowId) => {
      const rowRef = doc(db, 'tables', tableId, 'rows', rowId);
      batch.delete(rowRef);
    });
    await batch.commit();
    await updateTableMetadata(tableId, {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `tables/${tableId}/rows`);
    throw error;
  }
}
