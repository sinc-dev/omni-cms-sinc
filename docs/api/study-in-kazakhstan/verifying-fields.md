# Verifying Available Fields for Study in Kazakhstan

## Problem: Not Seeing Custom Fields

If you're not seeing custom fields when querying the API (e.g., for Coventry University), here's how to diagnose and fix the issue.

---

## Step 1: Check What the API Returns

### Test API Call

```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts/coventry-university-kazakhstan" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

### Check Response Structure

```typescript
const response = await fetch(
  'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts/coventry-university-kazakhstan',
  {
    headers: {
      'Authorization': 'Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7'
    }
  }
);

const data = await response.json();

console.log('Standard Fields:', Object.keys(data.data));
console.log('Custom Fields:', data.data.customFields);
console.log('Custom Fields Keys:', Object.keys(data.data.customFields || {}));
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "Coventry University Kazakhstan",
    "slug": "coventry-university-kazakhstan",
    "content": "...",
    "excerpt": "...",
    "customFields": {
      "location": "Almaty",
      "website": "https://coventry.kz",
      "established_year": 2020,
      // ... all other custom fields attached to universities post type
    }
  }
}
```

---

## Step 2: Check Schema - What Fields Are Available?

### Get Organization ID

```typescript
const orgsRes = await fetch(
  'https://omni-cms-api.joseph-9a2.workers.dev/api/admin/v1/organizations',
  {
    headers: {
      'Authorization': 'Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7'
    }
  }
);

const orgs = await orgsRes.json();
const orgId = orgs.data.find(o => o.slug === 'study-in-kazakhstan').id;
```

### Get Full Schema

```typescript
const schemaRes = await fetch(
  `https://omni-cms-api.joseph-9a2.workers.dev/api/admin/v1/organizations/${orgId}/schema`,
  {
    headers: {
      'Authorization': 'Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7'
    }
  }
);

const schema = await schemaRes.json();
```

### Find Universities Post Type

```typescript
const universitiesType = schema.data.postTypes.find(
  pt => pt.slug === 'universities' || pt.slug === 'university'
);

console.log('Universities Post Type:', universitiesType);
console.log('Available Custom Fields:', universitiesType.availableFields);
```

**Expected Output:**
```json
{
  "id": "post-type-id",
  "name": "Universities",
  "slug": "universities",
  "availableFields": [
    {
      "id": "field-id-1",
      "name": "Location",
      "slug": "location",
      "fieldType": "text",
      "isRequired": false,
      "defaultValue": null,
      "order": 0
    },
    {
      "id": "field-id-2",
      "name": "Website",
      "slug": "website",
      "fieldType": "url",
      "isRequired": false,
      "defaultValue": null,
      "order": 1
    },
    {
      "id": "field-id-3",
      "name": "Established Year",
      "slug": "established_year",
      "fieldType": "number",
      "isRequired": false,
      "defaultValue": null,
      "order": 2
    }
    // ... all other custom fields
  ]
}
```

---

## Step 3: Check Post Type Schema (Detailed)

### Get Post Type Schema

```typescript
const postTypeSchemaRes = await fetch(
  `https://omni-cms-api.joseph-9a2.workers.dev/api/admin/v1/organizations/${orgId}/schema/post-types/${universitiesType.id}`,
  {
    headers: {
      'Authorization': 'Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7'
    }
  }
);

const postTypeSchema = await postTypeSchemaRes.json();
console.log('Post Type Schema:', postTypeSchema.data);
```

This returns:
- All standard post properties
- All custom fields with full metadata
- Field types, validation rules, etc.

---

## Step 4: Verify Data is Populated

### Check if Custom Fields Have Values

The API code correctly:
1. ✅ Filters custom fields by post type (only returns fields attached to universities)
2. ✅ Returns all custom fields that have values
3. ✅ Sorts fields by their `order` property

**If custom fields are missing, possible causes:**

1. **Custom fields not attached to post type**
   - Solution: Attach custom fields to universities post type in CMS

2. **Custom fields not populated for the post**
   - Solution: Fill in custom field values for Coventry University in CMS

3. **Using `fields` parameter incorrectly**
   - Solution: Don't use `fields` parameter, or include `customFields` in it

---

## Step 5: Test with Different Queries

### Query 1: Get All Fields (No fields parameter)

```typescript
const university = await fetch(
  `${API_BASE}/posts/coventry-university-kazakhstan`
);
// Returns ALL fields including all custom fields
```

### Query 2: Explicitly Request Custom Fields

```typescript
const university = await fetch(
  `${API_BASE}/posts/coventry-university-kazakhstan?fields=id,title,slug,content,customFields`
);
// Returns specified fields + all custom fields
```

### Query 3: Request Specific Custom Fields

```typescript
const university = await fetch(
  `${API_BASE}/posts/coventry-university-kazakhstan?fields=id,title,slug,customFields.location,customFields.website,customFields.established_year`
);
// Returns only specified custom fields
```

---

## Step 6: Verify API Code is Working

The API code in `apps/api/src/routes/public/post-detail.ts`:

1. ✅ Fetches post type fields (line 112-115)
2. ✅ Filters custom field values by post type (line 153)
3. ✅ Returns custom fields in response (line 359-366)

**The code is correct.** If fields are missing, it's a data issue, not a code issue.

---

## Complete Diagnostic Script

```typescript
const API_BASE = 'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan';
const ADMIN_API_BASE = 'https://omni-cms-api.joseph-9a2.workers.dev/api/admin/v1';
const API_KEY = 'omni_099c139e8f5dce0edfc59cc9926d0cd7';

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

async function diagnoseFields() {
  console.log('🔍 Diagnosing Fields for Coventry University...\n');
  
  // 1. Get organization ID
  console.log('1. Getting organization ID...');
  const orgsRes = await fetch(`${ADMIN_API_BASE}/organizations`, { headers });
  const orgs = await orgsRes.json();
  const orgId = orgs.data.find(o => o.slug === 'study-in-kazakhstan')?.id;
  console.log(`   Organization ID: ${orgId}\n`);
  
  // 2. Get schema
  console.log('2. Getting schema...');
  const schemaRes = await fetch(`${ADMIN_API_BASE}/organizations/${orgId}/schema`, { headers });
  const schema = await schemaRes.json();
  const universitiesType = schema.data.postTypes.find(
    pt => pt.slug === 'universities' || pt.slug === 'university'
  );
  console.log(`   Universities Post Type: ${universitiesType?.name} (${universitiesType?.slug})`);
  console.log(`   Available Custom Fields: ${universitiesType?.availableFields?.length || 0}\n`);
  
  if (universitiesType?.availableFields) {
    console.log('   Custom Fields List:');
    universitiesType.availableFields.forEach((field: any) => {
      console.log(`     - ${field.name} (${field.slug}) [${field.fieldType}]`);
    });
    console.log('');
  }
  
  // 3. Get Coventry University
  console.log('3. Getting Coventry University...');
  const uniRes = await fetch(`${API_BASE}/posts/coventry-university-kazakhstan`, { headers });
  const uni = await uniRes.json();
  
  if (!uni.success) {
    console.log('   ❌ University not found or error occurred');
    return;
  }
  
  console.log(`   Title: ${uni.data.title}`);
  console.log(`   Slug: ${uni.data.slug}`);
  console.log(`   Standard Fields: ${Object.keys(uni.data).length}`);
  console.log(`   Custom Fields: ${Object.keys(uni.data.customFields || {}).length}\n`);
  
  // 4. Show custom fields
  if (uni.data.customFields && Object.keys(uni.data.customFields).length > 0) {
    console.log('   Custom Fields Values:');
    Object.entries(uni.data.customFields).forEach(([key, value]) => {
      console.log(`     - ${key}: ${value}`);
    });
  } else {
    console.log('   ⚠️ No custom fields returned');
    console.log('   Possible reasons:');
    console.log('     1. Custom fields not attached to universities post type');
    console.log('     2. Custom fields not populated for this university');
    console.log('     3. Custom fields exist but have no values');
  }
  
  // 5. Compare with schema
  console.log('\n4. Comparing with schema...');
  const schemaFieldSlugs = new Set(universitiesType?.availableFields?.map((f: any) => f.slug) || []);
  const returnedFieldSlugs = new Set(Object.keys(uni.data.customFields || {}));
  
  const missingInResponse = [...schemaFieldSlugs].filter(slug => !returnedFieldSlugs.has(slug));
  const extraInResponse = [...returnedFieldSlugs].filter(slug => !schemaFieldSlugs.has(slug));
  
  if (missingInResponse.length > 0) {
    console.log(`   ⚠️ Fields in schema but not in response: ${missingInResponse.join(', ')}`);
    console.log('     (These fields may not have values for this university)');
  }
  
  if (extraInResponse.length > 0) {
    console.log(`   ⚠️ Fields in response but not in schema: ${extraInResponse.join(', ')}`);
  }
  
  if (missingInResponse.length === 0 && extraInResponse.length === 0) {
    console.log('   ✅ All schema fields match response');
  }
}

diagnoseFields().catch(console.error);
```

---

## Summary

### The API Code is Correct ✅

The API correctly:
- Filters custom fields by post type
- Returns all custom fields that have values
- Sorts fields by order

### If Fields Are Missing

1. **Check Schema:** Verify custom fields are attached to universities post type
2. **Check Data:** Verify custom field values are populated for Coventry University
3. **Check Query:** Don't use `fields` parameter unless you include `customFields`

### What Fields Should Be Available?

For a complete university profile page, you typically need:

**Standard Fields:**
- ✅ title, slug, content, excerpt (always available)
- ✅ featuredImage (if set)
- ✅ taxonomies (location, categories, etc.)

**Custom Fields (must be configured):**
- location
- website
- contact_email
- phone
- address
- established_year
- description (extended)
- accreditation
- facilities
- student_count
- etc.

**To see exact fields, query the schema endpoint!**

