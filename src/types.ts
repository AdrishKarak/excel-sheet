export type ColumnType = 'text' | 'number' | 'date' | 'email' | 'phone' | 'dropdown' | 'checkbox';

export interface TableColumn {
  id: string;
  name: string;
  type: ColumnType;
  options?: string[]; // Split array from Firestore string representation
  createdAt: number;
  order: number;
}

export interface TableRow {
  id: string;
  cells: Record<string, any>; // columnId -> cellValue
  createdAt: number;
  updatedAt: number;
}

export interface TableMetadata {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
  lastUpdated: number;
  isFavorite?: boolean;
  duplicateOf?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  createdAt: number;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
