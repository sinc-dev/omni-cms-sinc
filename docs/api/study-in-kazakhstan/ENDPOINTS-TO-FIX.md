# Endpoints That Need Fixing

## Test Results Summary

Based on the curl tests, here are the endpoints that need attention:

---

## ✅ WORKING ENDPOINTS (But with Issues)

### 1. Get All Universities
**Status:** ✅ Returns data, but **customFields is empty**
- **URL:** `GET /api/public/v1/study-in-kazakhstan/posts?post_type=universities&per_page=2`
- **Response:** `{"success":true,"data":[...],"meta":{...}}`
- **Issue:** `"customFields":{}` - No custom fields returned
- **Expected:** Should return custom fields like `background_image`, `logo`, `location`, `website`, etc.

### 2. Get All Programs
**Status:** ✅ Returns data, but **customFields is empty**
- **URL:** `GET /api/public/v1/study-in-kazakhstan/posts?post_type=programs&per_page=2`
- **Response:** `{"success":true,"data":[...],"meta":{...}}`
- **Issue:** `"customFields":{}` - No custom fields returned
- **Expected:** Should return custom fields like `tuition_fee`, `duration`, `language`, etc.

### 3. Get Single University (Coventry)
**Status:** ✅ Returns data, but **customFields is empty**
- **URL:** `GET /api/public/v1/study-in-kazakhstan/posts/coventry-university-kazakhstan`
- **Response:** `{"success":true,"data":{...}}`
- **Issue:** `"customFields":{}` - No custom fields returned
- **Expected:** Should return all custom fields including media fields

### 4. Get Programs by University
**Status:** ✅ Returns data, but **customFields is empty**
- **URL:** `GET /api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=5`
- **Response:** `{"success":true,"data":[...],"meta":{...}}`
- **Issue:** `"customFields":{}` - No custom fields returned
- **Expected:** Should return program custom fields

---

## ❌ FAILED ENDPOINTS

### 5. Get Taxonomies (Disciplines)
**Status:** ❌ FAILED - Taxonomy not found
- **URL:** `GET /api/public/v1/study-in-kazakhstan/taxonomies/disciplines`
- **Response:** `{"success":false,"error":{"code":"NOT_FOUND","message":"Taxonomy not found"}}`
- **Issue:** Taxonomy slug "disciplines" doesn't exist
- **Fix Needed:** 
  - Find the correct taxonomy slug (might be `program-disciplines` or something else)
  - Or create the taxonomy if it doesn't exist
  - Update documentation with correct slug

### 6. Get Organizations (Admin)
**Status:** ❌ FAILED - Authentication required
- **URL:** `GET /api/admin/v1/organizations`
- **Response:** `{"success":false,"error":{"code":"UNAUTHORIZED","message":"Authentication required"}}`
- **Issue:** Admin endpoints require Cloudflare Access authentication, not API key
- **Fix Needed:** 
  - This is expected behavior - admin endpoints need Cloudflare Access
  - For API key access, need to check if there's an alternative endpoint
  - Or document that this endpoint requires admin access

---

## 🔴 CRITICAL ISSUE: Empty Custom Fields

**All working endpoints return empty custom fields: `"customFields":{}`**

This is the main issue that needs to be fixed. The API code looks correct, so the issue is likely:

### Possible Causes:

1. **Custom fields not attached to post types**
   - Custom fields exist but aren't linked to universities/programs post types in `post_type_fields` table
   - **Check:** Query `post_type_fields` to see if any fields are attached

2. **Custom fields not populated for posts**
   - Custom fields are attached but no values are set for the posts in `post_field_values` table
   - **Check:** Query `post_field_values` to see if values exist for Coventry University

3. **Media fields need special handling**
   - Media-type custom fields store media IDs that need to be resolved to media objects
   - The API code might not be resolving media IDs to full media objects
   - **Check:** If custom field values contain media IDs, they need to be resolved

### Investigation Steps:

1. **Check if custom fields are attached:**
   ```sql
   -- Get universities post type ID
   SELECT id FROM post_types WHERE slug = 'universities' AND organization_id = 'study-in-kazakhstan-org-id';
   
   -- Check attached custom fields
   SELECT ptf.*, cf.name, cf.slug, cf.field_type 
   FROM post_type_fields ptf
   JOIN custom_fields cf ON ptf.custom_field_id = cf.id
   WHERE ptf.post_type_id = 'universities-post-type-id';
   ```

2. **Check if values exist:**
   ```sql
   -- Get Coventry University ID
   SELECT id FROM posts WHERE slug = 'coventry-university-kazakhstan';
   
   -- Check custom field values
   SELECT pfv.*, cf.name, cf.slug, cf.field_type, pfv.value
   FROM post_field_values pfv
   JOIN custom_fields cf ON pfv.custom_field_id = cf.id
   WHERE pfv.post_id = '752a2eb7cd9a095a1c5c98ad';
   ```

3. **Check API code logic:**
   - The code at line 478-540 in `posts.ts` should fetch custom fields
   - It filters by `allowedCustomFieldIds` from `postTypeFieldsMap`
   - If `postTypeFieldsMap` is empty, no custom fields will be returned

### Fix Strategy:

1. **If custom fields aren't attached:**
   - Attach custom fields to post types via CMS or database
   - Ensure `post_type_fields` table has entries

2. **If values don't exist:**
   - Populate custom field values for posts via CMS
   - Ensure `post_field_values` table has entries

3. **If media fields need resolution:**
   - Check if media IDs in custom field values are being resolved
   - The API code should resolve media IDs to full media objects with URLs

---

## Next Steps to Fix

### Priority 1: Fix Custom Fields

1. **Query database to check:**
   - Are custom fields attached to post types?
   - Do custom field values exist for posts?
   - Are media fields being resolved?

2. **Test with a post that has custom fields:**
   - Create a test university with custom fields populated
   - Query that university and verify custom fields are returned

3. **Check API code:**
   - Verify `postTypeFieldsMap` is being populated correctly
   - Verify `filteredFieldValues` contains values
   - Verify media fields are being resolved if they're media type

### Priority 2: Fix Taxonomy Endpoint

1. **Find correct taxonomy slug:**
   - Query schema to find available taxonomies
   - Try alternative slugs: `program-disciplines`, `program-categories`

2. **Update documentation** with correct taxonomy slug

### Priority 3: Document Admin Endpoint Authentication

1. **Clarify authentication requirements** for admin endpoints
2. **Provide alternative** if API key access is needed

---

## Summary

**Working but needs fix:**
- ✅ Get All Universities - Missing custom fields
- ✅ Get All Programs - Missing custom fields  
- ✅ Get Single University - Missing custom fields
- ✅ Get Programs by University - Missing custom fields

**Not working:**
- ❌ Get Taxonomies - Wrong slug or doesn't exist
- ❌ Get Organizations (Admin) - Wrong authentication method

**Main Issue:** All endpoints return empty `customFields:{}` - this needs database investigation to determine if:
1. Custom fields aren't attached to post types
2. Custom field values don't exist for posts
3. Media fields aren't being resolved properly
