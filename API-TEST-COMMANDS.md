# Study in Kazakhstan API - Test Commands

Run these commands in your terminal (outside of Cursor's Agent mode) to test the endpoints:

## Base URL
```
https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan
```

## API Key
```
omni_099c139e8f5dce0edfc59cc9926d0cd7
```

## Test Commands

### 1. Get All Universities
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=universities&page=1&per_page=5" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

### 2. Get Single University (Coventry)
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts/coventry-university-kazakhstan" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

### 3. Get All Programs
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&per_page=5" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

### 4. Get Programs by University
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=5" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

### 5. Get Taxonomies (Disciplines)
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/taxonomies/program-disciplines" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

## PowerShell Commands

### Run the Test Script
```powershell
.\test-api-endpoints.ps1
```

### Or test individually:
```powershell
# Universities
$result = Invoke-RestMethod -Uri "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=universities&per_page=2" -Headers @{"Authorization"="Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"}
Write-Host "Success: $($result.success), Count: $($result.data.Count), Total: $($result.meta.total)"

# Single University
$result = Invoke-RestMethod -Uri "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts/coventry-university-kazakhstan" -Headers @{"Authorization"="Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"}
Write-Host "Success: $($result.success), Title: $($result.data.title)"

# Programs
$result = Invoke-RestMethod -Uri "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&per_page=2" -Headers @{"Authorization"="Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"}
Write-Host "Success: $($result.success), Count: $($result.data.Count), Total: $($result.meta.total)"
```

## Expected Results

All endpoints should return JSON with:
- `success: true`
- `data`: Array or object with the requested data
- `meta`: Pagination metadata (for list endpoints)

## Note

Cursor's Agent mode has a known issue with terminal output display on Windows. The commands execute successfully (exit code 0) but output may not be visible. Run these commands in a regular terminal window or PowerShell to see the results.

