/**
 * Cursor-based pagination utilities
 * Cursors are base64-encoded JSON objects containing pagination state
 */

export interface CursorData {
  entityType: string;
  lastId: string;
  sortValue?: string | number | Date;
  sortProperty?: string;
}

/**
 * Encode cursor data to base64 string
 */
export function encodeCursor(data: CursorData): string {
  const json = JSON.stringify(data);
  return Buffer.from(json).toString('base64');
}

/**
 * Decode cursor string to cursor data
 */
export function decodeCursor(cursor: string): CursorData | null {
  try {
    const json = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(json) as CursorData;
  } catch (error) {
    return null;
  }
}

/**
 * Create cursor from last item in results
 */
export function createCursor(
  entityType: string,
  lastId: string,
  sortValue?: string | number | Date,
  sortProperty?: string
): string {
  return encodeCursor({
    entityType,
    lastId,
    sortValue: sortValue instanceof Date ? sortValue.toISOString() : sortValue,
    sortProperty,
  });
}

