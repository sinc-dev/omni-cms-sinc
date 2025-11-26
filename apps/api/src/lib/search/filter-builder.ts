import { eq, ne, gt, gte, lt, lte, inArray, notInArray, like, notLike, isNull, isNotNull, and, or, sql, between } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { Filter, FilterGroup } from '@/lib/validations/search';
import { posts, postFieldValues, customFields, postRelationships, postTaxonomies, taxonomyTerms, taxonomies } from '@/db/schema';
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

    // Handle relationship properties (relationships.type.field)
    if (property.startsWith('relationships.')) {
      return this.buildRelationshipCondition(property, operator, value);
    }

    // Handle taxonomy properties (taxonomies.taxonomy-slug or taxonomies.taxonomy-slug.term-slug)
    if (property.startsWith('taxonomies.')) {
      return this.buildTaxonomyCondition(property, operator, value);
    }

    // Handle nested properties (e.g., author.name, postType.slug)
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
    const column = (posts as any)[property];
    if (!column) {
      return null; // Property doesn't exist
    }

    switch (operator) {
      case 'eq':
        if (value === null) return isNull(column);
        return eq(column, value as any);
      
      case 'ne':
        if (value === null) return isNotNull(column);
        return ne(column, value as any);
      
      case 'gt':
        if (typeof value !== 'number' && typeof value !== 'string') return null;
        return gt(column, value as any);
      
      case 'gte':
        if (typeof value !== 'number' && typeof value !== 'string') return null;
        return gte(column, value as any);
      
      case 'lt':
        if (typeof value !== 'number' && typeof value !== 'string') return null;
        return lt(column, value as any);
      
      case 'lte':
        if (typeof value !== 'number' && typeof value !== 'string') return null;
        return lte(column, value as any);
      
      case 'in':
        if (!Array.isArray(value) || value.length === 0) return null;
        return inArray(column, value as any[]);
      
      case 'not_in':
        if (!Array.isArray(value) || value.length === 0) return null;
        return notInArray(column, value as any[]);
      
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
        return between(column, value[0] as any, value[1] as any);
      
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
   * Build condition for relationship property
   * Supports: relationships.{type}.{field} (e.g., relationships.university.slug)
   */
  private async buildRelationshipCondition(
    property: string,
    operator: Filter['operator'],
    value: Filter['value']
  ): Promise<SQL<unknown> | null> {
    const parts = property.split('.');
    if (parts.length < 3) {
      return null; // Invalid format
    }

    const relationshipType = parts[1]; // e.g., "university"
    const relatedField = parts[2]; // e.g., "slug" or "id"

    if (!value || (typeof value !== 'string' && !Array.isArray(value))) {
      return null;
    }

    // Find related posts by the specified field
    let relatedPostIds: string[] = [];

    if (relatedField === 'id') {
      // Direct ID match
      const ids = Array.isArray(value) ? value : [value];
      relatedPostIds = ids.filter((id): id is string => typeof id === 'string');
    } else if (relatedField === 'slug') {
      // Find posts by slug
      const slugs = Array.isArray(value) ? value : [value];
      const relatedPosts = await Promise.all(
        slugs.map(slug =>
          this.db.query.posts.findFirst({
            where: (p, { eq, and: andFn }) => andFn(
              eq(p.organizationId, this.organizationId),
              eq(p.slug, slug as string),
              eq(p.status, 'published')
            ),
            columns: { id: true },
          })
        )
      );
      relatedPostIds = relatedPosts.filter(Boolean).map(p => p!.id);
    } else {
      return null; // Unsupported field
    }

    if (relatedPostIds.length === 0) {
      // No related posts found - return condition that matches nothing
      return sql`1 = 0`;
    }

    // Find all posts that have relationships to these posts
    const relationships = await this.db.query.postRelationships.findMany({
      where: (pr, { eq, and: andFn, inArray }) => andFn(
        inArray(pr.toPostId, relatedPostIds),
        eq(pr.relationshipType, relationshipType)
      ),
      columns: { fromPostId: true },
    });

    const postIds = relationships.map(r => r.fromPostId);

    if (postIds.length === 0) {
      return sql`1 = 0`; // No matches
    }

    // Build condition based on operator
    switch (operator) {
      case 'eq':
      case 'in':
        return inArray(posts.id, postIds);
      case 'ne':
      case 'not_in':
        return notInArray(posts.id, postIds);
      default:
        return null; // Unsupported operator
    }
  }

  /**
   * Build condition for taxonomy property
   * Supports: taxonomies.{taxonomy-slug} or taxonomies.{taxonomy-slug}.{term-slug}
   */
  private async buildTaxonomyCondition(
    property: string,
    operator: Filter['operator'],
    value: Filter['value']
  ): Promise<SQL<unknown> | null> {
    const parts = property.split('.');
    if (parts.length < 2) {
      return null; // Invalid format
    }

    const taxonomySlug = parts[1]; // e.g., "program-degree-level"
    const termSlug = parts[2]; // Optional, e.g., "bachelor"

    // Find taxonomy
    const taxonomy = await this.db.query.taxonomies.findFirst({
      where: (t, { eq, and: andFn }) => andFn(
        eq(t.organizationId, this.organizationId),
        eq(t.slug, taxonomySlug)
      ),
    });

    if (!taxonomy) {
      return sql`1 = 0`; // Taxonomy not found
    }

    let termIds: string[] = [];

    if (termSlug) {
      // Specific term filter
      const term = await this.db.query.taxonomyTerms.findFirst({
        where: (tt, { eq, and: andFn }) => andFn(
          eq(tt.taxonomyId, taxonomy.id),
          eq(tt.slug, termSlug)
        ),
      });
      if (term) {
        termIds = [term.id];
      } else {
        return sql`1 = 0`; // Term not found
      }
    } else if (value) {
      // Filter by term slugs provided in value
      const slugs = Array.isArray(value) ? value : [value];
      const terms = await Promise.all(
        slugs.map(slug =>
          this.db.query.taxonomyTerms.findFirst({
            where: (tt, { eq, and: andFn }) => andFn(
              eq(tt.taxonomyId, taxonomy.id),
              eq(tt.slug, slug as string)
            ),
            columns: { id: true },
          })
        )
      );
      termIds = terms.filter(Boolean).map(t => t!.id);
    } else {
      return null; // Need either termSlug in property or value
    }

    if (termIds.length === 0) {
      return sql`1 = 0`; // No terms found
    }

    // Find posts with these taxonomy terms
    const postTaxonomies = await this.db.query.postTaxonomies.findMany({
      where: (pt, { inArray }) => inArray(pt.taxonomyTermId, termIds),
      columns: { postId: true },
    });

    const postIds = Array.from(new Set(postTaxonomies.map(pt => pt.postId)));

    if (postIds.length === 0) {
      return sql`1 = 0`; // No posts found
    }

    // Build condition based on operator
    switch (operator) {
      case 'eq':
      case 'in':
        return inArray(posts.id, postIds);
      case 'ne':
      case 'not_in':
        return notInArray(posts.id, postIds);
      default:
        return null; // Unsupported operator
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

