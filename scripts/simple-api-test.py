import requests
import json

API_BASE = "https://omni-cms-api.joseph-9a2.workers.dev"
API_KEY = "omni_099c139e8f5dce0edfc59cc9926d0cd7"
ORG_SLUG = "study-in-kazakhstan"

headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

endpoints = [
    ("Get All Universities", f"{API_BASE}/api/public/v1/{ORG_SLUG}/posts?post_type=universities&per_page=2"),
    ("Get All Programs", f"{API_BASE}/api/public/v1/{ORG_SLUG}/posts?post_type=programs&per_page=2"),
    ("Search Universities", f"{API_BASE}/api/public/v1/{ORG_SLUG}/posts?post_type=universities&search=coventry&per_page=5"),
    ("Get Single University", f"{API_BASE}/api/public/v1/{ORG_SLUG}/posts/coventry-university-kazakhstan"),
    ("Get Programs by University", f"{API_BASE}/api/public/v1/{ORG_SLUG}/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=5"),
    ("Get Taxonomies", f"{API_BASE}/api/public/v1/{ORG_SLUG}/taxonomies/disciplines"),
    ("Get Organizations (Admin)", f"{API_BASE}/api/admin/v1/organizations"),
    ("Field Selection", f"{API_BASE}/api/public/v1/{ORG_SLUG}/posts?post_type=universities&fields=id,title,slug,customFields&per_page=2"),
]

results = []
for name, url in endpoints:
    try:
        r = requests.get(url, headers=headers, timeout=10)
        data = r.json() if r.text else {}
        status = "✅ WORKING" if r.status_code == 200 and data.get("success") else f"❌ FAILED ({r.status_code})"
        results.append({"name": name, "url": url, "status": status, "code": r.status_code, "success": data.get("success"), "error": data.get("error")})
    except Exception as e:
        results.append({"name": name, "url": url, "status": f"❌ ERROR: {str(e)}", "code": None, "success": False, "error": str(e)})

with open("test-results.txt", "w") as f:
    f.write("API ENDPOINT TEST RESULTS\n")
    f.write("=" * 60 + "\n\n")
    for r in results:
        f.write(f"{r['name']}\n")
        f.write(f"Status: {r['status']}\n")
        f.write(f"URL: {r['url']}\n")
        if r.get('error'):
            f.write(f"Error: {r['error']}\n")
        f.write("\n")

print("Test complete. Results saved to test-results.txt")

