import { eq, ne, gt, gte, lt, lte, inArray, notInArray, like, notLike, isNull, isNotNull, and, or, sql, between } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { Filter, FilterGroup } from '@/lib/validations/search';
import { posts, postFieldValues, customFields } from '@/db/schema';
import type { DbClient } from '@/db/client';

/**
 * Builds Drizzle ORM conditions from filter groups
 */
export class FilterBuilder {
  private db: DbClient;
  private organizationId: string;
  private customFieldMap: Map<string, string> = new Map(); // slug -> id

  constructor(db: DbClient, organizationId: string) {
    this.db = db;
    this.organizationId = organizationId;
  }

  /**
   * Build conditions from filter groups
   */
  async buildConditions(filterGroups: FilterGroup[]): Promise<SQL<unknown>[]> {
    const conditions: SQL<unknown>[] = [];

    for (const group of filterGroups) {
      const groupConditions = await Promise.all(
        group.filters.map(filter => this.buildFilterCondition(filter))
      );

      if (groupConditions.length > 0) {
        if (group.operator === 'OR') {
          conditions.push(or(...groupConditions.filter((c): c is SQL => c !== null))!);
        } else {
          conditions.push(and(...groupConditions.filter((c): c is SQL => c !== null))!);
        }
      }
    }

    return conditions;
  }

  /**
   * Build a single filter condition
   */
  private async buildFilterCondition(filter: Filter): Promise<SQL<unknown> | null> {
    const { property, operator, value } = filter;

    // Handle custom field properties (customFields.field_slug)
    if (property.startsWith('customFields.')) {
      return this.buildCustomFieldCondition(property, operator, value);
    }

    // Handle nested properties (e.g., author.name)
    if (property.includes('.')) {
      // For now, we'll handle these in the query builder
      // Return null to indicate this needs special handling
      return null;
    }

    // Handle standard post properties
    return this.buildStandardCondition(property, operator, value);
  }

  /**
   * Build condition for custom field
   */
  private async buildCustomFieldCondition(
    property: string,
    operator: Filter['operator'],
    value: Filter['value']
  ): Promise<SQL<unknown> | null> {
    const fieldSlug = property.replace('customFields.', '');
    
    // Get custom field ID from slug
    const customField = await this.getCustomFieldBySlug(fieldSlug);
    if (!customField) {
      return null; // Field doesn't exist
    }

    // Build condition based on operator
    switch (operator) {
      case 'eq':
        if (value === null) return null;
        return sql`EXISTS (
          SELECT 1 FROM ${postFieldValues} 
          WHERE ${postFieldValues.postId} = ${posts.id}
          AND ${postFieldValues.customFieldId} = ${customField.id}
          AND ${postFieldValues.value} = ${sql.raw(`'${String(value).replace(/'/g, "''")}'`)}
        )`;
      
      case 'ne':
        if (value === null) return null;
        return sql`EXISTS (
          SELECT 1 FROM ${postFieldValues} 
          WHERE ${postFieldValues.postId} = ${posts.id}
          AND ${postFieldValues.customFieldId} = ${customField.id}
          AND ${postFieldValues.value} != ${sql.raw(`'${String(value).replace(/'/g, "''")}'`)}
        )`;
      
      case 'contains':
        if (typeof value !== 'string') return null;
        const containsValue = value.replace(/'/g, "''");
        return sql`EXISTS (
          SELECT 1 FROM ${postFieldValues} 
          WHERE ${postFieldValues.postId} = ${posts.id}
          AND ${postFieldValues.customFieldId} = ${customField.id}
          AND ${postFieldValues.value} LIKE ${sql.raw(`'%${containsValue}%'`)}
        )`;
      
      case 'not_contains':
        if (typeof value !== 'string') return null;
        const notContainsValue = value.replace(/'/g, "''");
        return sql`NOT EXISTS (
          SELECT 1 FROM ${postFieldValues} 
          WHERE ${postFieldValues.postId} = ${posts.id}
          AND ${postFieldValues.customFieldId} = ${customField.id}
          AND ${postFieldValues.value} LIKE ${sql.raw(`'%${notContainsValue}%'`)}
        )`;
      
      case 'in':
        if (!Array.isArray(value) || value.length === 0) return null;
        const inValues = value.map(v => `'${String(v).replace(/'/g, "''")}'`);
        return sql`EXISTS (
          SELECT 1 FROM ${postFieldValues} 
          WHERE ${postFieldValues.postId} = ${posts.id}
          AND ${postFieldValues.customFieldId} = ${customField.id}
          AND ${postFieldValues.value} IN (${sql.raw(`(${inValues.join(', ')})`)})
        )`;
      
      case 'not_in':
        if (!Array.isArray(value) || value.length === 0) return null;
        const notInValues = value.map(v => `'${String(v).replace(/'/g, "''")}'`);
        return sql`NOT EXISTS (
          SELECT 1 FROM ${postFieldValues} 
          WHERE ${postFieldValues.postId} = ${posts.id}
          AND ${postFieldValues.customFieldId} = ${customField.id}
          AND ${postFieldValues.value} IN (${sql.raw(`(${notInValues.join(', ')})`)})
        )`;
      
      case 'is_null':
        return sql`NOT EXISTS (
          SELECT 1 FROM ${postFieldValues} 
          WHERE ${postFieldValues.postId} = ${posts.id}
          AND ${postFieldValues.customFieldId} = ${customField.id}
        )`;
      
      case 'is_not_null':
        return sql`EXISTS (
          SELECT 1 FROM ${postFieldValues} 
          WHERE ${postFieldValues.postId} = ${posts.id}
          AND ${postFieldValues.customFieldId} = ${customField.id}
        )`;
      
      case 'gt':
      case 'gte':
      case 'lt':
      case 'lte':
        if (typeof value !== 'number' && typeof value !== 'string') return null;
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) return null;
        
        const op = operator === 'gt' ? '>' : operator === 'gte' ? '>=' : operator === 'lt' ? '<' : '<=';
        return sql`EXISTS (
          SELECT 1 FROM ${postFieldValues} 
          WHERE ${postFieldValues.postId} = ${posts.id}
          AND ${postFieldValues.customFieldId} = ${customField.id}
          AND CAST(${postFieldValues.value} AS REAL) ${sql.raw(op)} ${sql.raw(String(numValue))}
        )`;
      
      default:
        return null;
    }
  }

  /**
   * Build condition for standard post property
   */
  private buildStandardCondition(
    property: string,
    operator: Filter['operator'],
    value: Filter['value']
  ): SQL<unknown> | null {
    const column = (posts as Record<string, SQL>)[property];
    if (!column) {
      return null; // Property doesn't exist
    }

    switch (operator) {
      case 'eq':
        if (value === null) return isNull(column);
        return eq(column, value as string | number | boolean);
      
      case 'ne':
        if (value === null) return isNotNull(column);
        return ne(column, value as string | number | boolean);
      
      case 'gt':
        if (typeof value !== 'number' && typeof value !== 'string') return null;
        return gt(column, value as string | number);
      
      case 'gte':
        if (typeof value !== 'number' && typeof value !== 'string') return null;
        return gte(column, value as string | number);
      
      case 'lt':
        if (typeof value !== 'number' && typeof value !== 'string') return null;
        return lt(column, value as string | number);
      
      case 'lte':
        if (typeof value !== 'number' && typeof value !== 'string') return null;
        return lte(column, value as string | number);
      
      case 'in':
        if (!Array.isArray(value) || value.length === 0) return null;
        return inArray(column, value as (string | number)[]);
      
      case 'not_in':
        if (!Array.isArray(value) || value.length === 0) return null;
        return notInArray(column, value as (string | number)[]);
      
      case 'contains':
        if (typeof value !== 'string') return null;
        return like(column, `%${value}%`);
      
      case 'not_contains':
        if (typeof value !== 'string') return null;
        return notLike(column, `%${value}%`);
      
      case 'starts_with':
        if (typeof value !== 'string') return null;
        return like(column, `${value}%`);
      
      case 'ends_with':
        if (typeof value !== 'string') return null;
        return like(column, `%${value}`);
      
      case 'is_null':
        return isNull(column);
      
      case 'is_not_null':
        return isNotNull(column);
      
      case 'between':
        if (!Array.isArray(value) || value.length !== 2) return null;
        return between(column, value[0] as string | number, value[1] as string | number);
      
      case 'date_eq':
      case 'date_gt':
      case 'date_gte':
      case 'date_lt':
      case 'date_lte':
        if (typeof value !== 'string') return null;
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) return null;
        
        const dateTimeValue = dateValue.getTime();
        const dateOp = operator === 'date_eq' ? 'eq' : 
                      operator === 'date_gt' ? 'gt' :
                      operator === 'date_gte' ? 'gte' :
                      operator === 'date_lt' ? 'lt' : 'lte';
        
        // Handle date operators directly instead of recursive call
        switch (dateOp) {
          case 'eq':
            return eq(column, dateTimeValue);
          case 'gt':
            return gt(column, dateTimeValue);
          case 'gte':
            return gte(column, dateTimeValue);
          case 'lt':
            return lt(column, dateTimeValue);
          case 'lte':
            return lte(column, dateTimeValue);
          default:
            return null;
        }
      
      case 'date_between':
        if (!Array.isArray(value) || value.length !== 2) return null;
        const [start, end] = value.map(v => new Date(v as string));
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
        const startTime = start.getTime();
        const endTime = end.getTime();
        return and(gte(column, startTime), lte(column, endTime)) ?? null;
      
      default:
        return null;
    }
  }

  /**
   * Get custom field by slug (with caching)
   */
  private async getCustomFieldBySlug(slug: string): Promise<{ id: string; fieldType: string } | null> {
    if (this.customFieldMap.has(slug)) {
      const id = this.customFieldMap.get(slug)!;
      const field = await this.db.query.customFields.findFirst({
        where: (fields, { eq, and: andFn }) => andFn(
          eq(fields.id, id),
          eq(fields.organizationId, this.organizationId)
        ),
        columns: { id: true, fieldType: true },
      });
      return field ? { id: field.id, fieldType: field.fieldType } : null;
    }

    const field = await this.db.query.customFields.findFirst({
      where: (fields, { eq, and: andFn }) => andFn(
        eq(fields.slug, slug),
        eq(fields.organizationId, this.organizationId)
      ),
      columns: { id: true, fieldType: true },
    });

    if (field) {
      this.customFieldMap.set(slug, field.id);
      return { id: field.id, fieldType: field.fieldType };
    }

    return null;
  }
}

