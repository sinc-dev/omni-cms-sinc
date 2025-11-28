# Study in Kazakhstan API Endpoint Test Report

## Test Script

Run the Python script to test all endpoints:

```bash
python run_tests.py
```

Or test individual endpoints using curl:

## Endpoints to Test

### 1. Get All Universities
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=universities&per_page=2" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

**Expected:** Returns list of universities with custom fields

### 2. Get Single University (Coventry)
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts/coventry-university-kazakhstan" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

**Expected:** Returns single university with all custom fields including media

### 3. Get All Programs
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&per_page=2" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

**Expected:** Returns list of programs with custom fields

### 4. Get Programs by University
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=5" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

**Expected:** Returns programs related to Coventry University

### 5. Get Taxonomies (disciplines)
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/taxonomies/disciplines" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

**Expected:** Returns taxonomy terms for disciplines (may fail if taxonomy slug is different)

### 6. Get Taxonomies (program-disciplines)
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/taxonomies/program-disciplines" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

**Expected:** Returns taxonomy terms for program disciplines

### 7. Get Programs by Discipline
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/taxonomies/disciplines/engineering/posts?post_type=programs&per_page=5" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

**Expected:** Returns programs in engineering discipline

## Known Issues (from ENDPOINTS-TO-FIX.md)

1. **Custom Fields Empty:** All endpoints may return empty `customFields: {}`
   - Possible causes:
     - Custom fields not attached to post types
     - Custom field values not populated
     - Media fields not being resolved

2. **Taxonomy Endpoints:** May fail if taxonomy slugs are incorrect
   - Try `program-disciplines` instead of `disciplines`
   - Check actual taxonomy slugs in database

## Python Test Script

The `run_tests.py` script will:
- Test all 6 endpoints
- Display HTTP status codes
- Check for custom fields
- Save results to `test_results.txt` and `test_results.json`

Run it with:
```bash
python run_tests.py
```
