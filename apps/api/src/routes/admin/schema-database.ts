import { Hono } from 'hono';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-admin-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';

const app = new Hono<{ Bindings: CloudflareBindings }>();

interface TableColumn {
  name: string;
  type: string;
  primaryKey: boolean;
  nullable: boolean;
  unique?: boolean;
  foreignKey?: string;
  defaultValue?: string | null;
}

interface TableIndex {
  name: string;
  columns: string[];
  unique: boolean;
}

interface TableSchema {
  name: string;
  columns: TableColumn[];
  indexes: TableIndex[];
}

// Helper function to get table list
async function getTableList(d1: D1Database): Promise<string[]> {
  const result = await d1.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
  return (result.results as Array<{ name: string }>).map((row) => row.name);
}

// Helper function to get table info (columns)
async function getTableInfo(d1: D1Database, tableName: string): Promise<TableColumn[]> {
  // Use parameterized query to prevent SQL injection
  // Note: PRAGMA doesn't support parameters, but tableName comes from sqlite_master so it's safe
  // Still, we'll validate it contains only safe characters
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    throw new Error('Invalid table name');
  }
  const result = await d1.prepare(`PRAGMA table_info(${tableName})`).all();
  const columns: TableColumn[] = [];
  
  for (const row of result.results as Array<{
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: string | null;
    pk: number;
  }>) {
    columns.push({
      name: row.name,
      type: row.type.toUpperCase(),
      primaryKey: row.pk === 1,
      nullable: row.notnull === 0,
      defaultValue: row.dflt_value,
    });
  }
  
  return columns;
}

// Helper function to get indexes for a table
async function getTableIndexes(d1: D1Database, tableName: string): Promise<TableIndex[]> {
  // Validate table name
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    throw new Error('Invalid table name');
  }
  const indexListResult = await d1.prepare(`PRAGMA index_list(${tableName})`).all();
  const indexes: TableIndex[] = [];
  
  for (const indexRow of indexListResult.results as Array<{
    seq: number;
    name: string;
    unique: number;
    origin: string;
    partial: number;
  }>) {
    // Skip auto-generated indexes (like those for unique constraints)
    if (indexRow.origin === 'c') {
      continue;
    }
    
    // Get columns for this index
    // Validate index name
    const indexName = indexRow.name;
    if (!/^[a-zA-Z0-9_]+$/.test(indexName)) {
      continue; // Skip invalid index names
    }
    const indexInfoResult = await d1.prepare(`PRAGMA index_info(${indexName})`).all();
    const indexInfoRows = indexInfoResult.results as Array<{
      seqno: number;
      cid: number;
      name: string;
    }>;
    const columns = indexInfoRows
      .sort((a, b) => a.seqno - b.seqno)
      .map((col) => col.name);
    
    indexes.push({
      name: indexRow.name,
      columns,
      unique: indexRow.unique === 1,
    });
  }
  
  return indexes;
}

// Helper function to get foreign keys for a table
async function getForeignKeys(d1: D1Database, tableName: string): Promise<Record<string, string>> {
  // Validate table name
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    throw new Error('Invalid table name');
  }
  const result = await d1.prepare(`PRAGMA foreign_key_list(${tableName})`).all();
  const foreignKeys: Record<string, string> = {};
  
  for (const row of result.results as Array<{
    id: number;
    seq: number;
    table: string;
    from: string;
    to: string;
  }>) {
    foreignKeys[row.from] = `${row.table}.${row.to}`;
  }
  
  return foreignKeys;
}

// GET /api/admin/v1/organizations/:orgId/schema/database
app.get(
  '/:orgId/schema/database',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('post-types:read'),
  async (c) => {
    try {
      const d1 = c.env.DB;
      const tables: TableSchema[] = [];
      
      // Get list of all tables
      const tableNames = await getTableList(d1);
      
      // For each table, get its schema
      for (const tableName of tableNames) {
        const [columns, indexes, foreignKeys] = await Promise.all([
          getTableInfo(d1, tableName),
          getTableIndexes(d1, tableName),
          getForeignKeys(d1, tableName),
        ]);
        
        // Add foreign key information to columns
        const columnsWithFKs = columns.map((col) => ({
          ...col,
          foreignKey: foreignKeys[col.name] || undefined,
        }));
        
        tables.push({
          name: tableName,
          columns: columnsWithFKs,
          indexes,
        });
      }
      
      const schema = {
        tables,
      };

      return c.json(successResponse(schema));
    } catch (error) {
      console.error('Error introspecting database schema:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error details:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        organizationId: c.req.param('orgId'),
      });
      return c.json(
        Errors.serverError(
          error instanceof Error ? error.message : 'Failed to introspect database schema'
        ),
        500
      );
    }
  }
);

export default app;

