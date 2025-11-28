# API Endpoint Test Report

## Test Date
Generated: Manual testing required

## Endpoints to Test

### ✅/❌ Status Legend
- ✅ WORKING - Endpoint returns 200 with success=true
- ⚠️ PARTIAL - Endpoint returns 200 but success=false or unexpected format
- ❌ FAILED - Endpoint returns error status code or throws exception

---

## 1. Get All Universities

**Endpoint:**
```
GET /api/public/v1/study-in-kazakhstan/posts?post_type=universities&per_page=2
```

**Test Command:**
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=universities&per_page=2" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

**Expected:**
- Status: 200
- Response: `{"success": true, "data": [...], "meta": {...}}`

**Status:** ⏳ PENDING TEST

---

## 2. Get All Programs

**Endpoint:**
```
GET /api/public/v1/study-in-kazakhstan/posts?post_type=programs&per_page=2
```

**Test Command:**
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&per_page=2" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

**Expected:**
- Status: 200
- Response: `{"success": true, "data": [...], "meta": {...}}`

**Status:** ⏳ PENDING TEST

---

## 3. Search Universities (Coventry)

**Endpoint:**
```
GET /api/public/v1/study-in-kazakhstan/posts?post_type=universities&search=coventry&per_page=5
```

**Test Command:**
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=universities&search=coventry&per_page=5" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

**Expected:**
- Status: 200
- Response: `{"success": true, "data": [...], "meta": {...}}`
- Should include Coventry University in results

**Status:** ⏳ PENDING TEST

---

## 4. Get Single University (Coventry)

**Endpoint:**
```
GET /api/public/v1/study-in-kazakhstan/posts/coventry-university-kazakhstan
```

**Test Command:**
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts/coventry-university-kazakhstan" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

**Expected:**
- Status: 200
- Response: `{"success": true, "data": {...}}`
- Should include all custom fields (background_image, logo, gallery, etc.)

**Status:** ⏳ PENDING TEST

---

## 5. Get Programs by University

**Endpoint:**
```
GET /api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=5
```

**Test Command:**
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=5" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

**Expected:**
- Status: 200
- Response: `{"success": true, "data": [...], "meta": {...}}`
- Should return programs related to Coventry University

**Status:** ⏳ PENDING TEST

---

## 6. Get Taxonomies (Disciplines)

**Endpoint:**
```
GET /api/public/v1/study-in-kazakhstan/taxonomies/disciplines
```

**Test Command:**
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/taxonomies/disciplines" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

**Expected:**
- Status: 200
- Response: `{"success": true, "data": {"taxonomy": {...}, "terms": [...]}}`

**Note:** Taxonomy slug might be different (e.g., `program-disciplines`). Check schema first.

**Status:** ⏳ PENDING TEST

---

## 7. Get Organizations (Admin)

**Endpoint:**
```
GET /api/admin/v1/organizations
```

**Test Command:**
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/admin/v1/organizations" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

**Expected:**
- Status: 200
- Response: `{"success": true, "data": [...]}`
- Should include study-in-kazakhstan organization

**Status:** ⏳ PENDING TEST

---

## 8. Field Selection Test

**Endpoint:**
```
GET /api/public/v1/study-in-kazakhstan/posts?post_type=universities&fields=id,title,slug,customFields&per_page=2
```

**Test Command:**
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=universities&fields=id,title,slug,customFields&per_page=2" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

**Expected:**
- Status: 200
- Response: `{"success": true, "data": [...]}`
- Should only include specified fields

**Status:** ⏳ PENDING TEST

---

## 9. Get Schema (Admin)

**Endpoint:**
```
GET /api/admin/v1/organizations/{orgId}/schema
```

**Test Command:**
```bash
# First get org ID
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/admin/v1/organizations" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"

# Then get schema (replace {orgId} with actual ID)
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/admin/v1/organizations/{orgId}/schema" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

**Expected:**
- Status: 200
- Response: `{"success": true, "data": {"postTypes": [...], "taxonomies": [...]}}`

**Status:** ⏳ PENDING TEST

---

## 10. Get Post Type Schema (Admin)

**Endpoint:**
```
GET /api/admin/v1/organizations/{orgId}/schema/post-types/{postTypeId}
```

**Test Command:**
```bash
# Replace {orgId} and {postTypeId} with actual IDs from schema
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/admin/v1/organizations/{orgId}/schema/post-types/{postTypeId}" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

**Expected:**
- Status: 200
- Response: `{"success": true, "data": {"properties": {...}}}`

**Status:** ⏳ PENDING TEST

---

## Testing Instructions

1. **Run each test command** in your terminal
2. **Check the HTTP status code** (should be 200 for success)
3. **Verify the response format** matches expected structure
4. **Check for custom fields** in university/program responses
5. **Update status** in this document (✅ WORKING, ⚠️ PARTIAL, ❌ FAILED)

## Common Issues to Check

1. **404 Not Found** - Organization slug might be incorrect
2. **401 Unauthorized** - API key might be invalid
3. **500 Internal Server Error** - Backend issue
4. **success: false** - Check error message in response
5. **Missing custom fields** - Fields might not be attached to post type or not populated

## Next Steps

After testing:
1. Update status for each endpoint
2. Document any errors found
3. Fix issues in backend code
4. Re-test fixed endpoints

