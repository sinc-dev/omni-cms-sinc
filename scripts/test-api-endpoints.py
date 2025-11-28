#!/usr/bin/env python3
"""
Test API endpoints for Study in Kazakhstan
"""
import requests
import json
import sys

API_BASE = "https://omni-cms-api.joseph-9a2.workers.dev"
API_KEY = "omni_099c139e8f5dce0edfc59cc9926d0cd7"
ORG_SLUG = "study-in-kazakhstan"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

results = []

def test_endpoint(name, url, headers):
    """Test an endpoint and return result"""
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        status_code = response.status_code
        
        try:
            data = response.json()
        except:
            data = {"raw": response.text[:200]}
        
        result = {
            "name": name,
            "url": url,
            "status_code": status_code,
            "success": data.get("success") if isinstance(data, dict) else None,
            "has_data": "data" in data if isinstance(data, dict) else False,
            "data_count": len(data.get("data", [])) if isinstance(data, dict) and isinstance(data.get("data"), list) else (1 if data.get("data") else 0),
            "error": None,
            "raw_response": response.text[:500] if len(response.text) > 500 else response.text
        }
        
        if status_code == 200:
            if isinstance(data, dict) and data.get("success"):
                print(f"✅ Status: {status_code} - SUCCESS")
                if isinstance(data.get("data"), list):
                    print(f"   Data: {len(data['data'])} items")
                elif data.get("data"):
                    print(f"   Data: Present")
                result["status"] = "✅ WORKING"
            else:
                print(f"⚠️ Status: {status_code} - API returned success=false or unexpected format")
                if isinstance(data, dict) and "error" in data:
                    print(f"   Error: {data.get('error')}")
                result["status"] = "⚠️ PARTIAL"
                result["error"] = data.get("error") if isinstance(data, dict) else "Unexpected response format"
        else:
            print(f"❌ Status: {status_code} - ERROR")
            result["status"] = "❌ FAILED"
            result["error"] = data.get("error") if isinstance(data, dict) else f"HTTP {status_code}"
        
        return result
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Request Exception: {str(e)}")
        return {
            "name": name,
            "url": url,
            "status_code": None,
            "success": False,
            "has_data": False,
            "data_count": 0,
            "error": str(e),
            "status": "❌ FAILED",
            "raw_response": None
        }
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return {
            "name": name,
            "url": url,
            "status_code": None,
            "success": False,
            "has_data": False,
            "data_count": 0,
            "error": str(e),
            "status": "❌ FAILED",
            "raw_response": None
        }

# Test endpoints
print("🔍 Testing Study in Kazakhstan API Endpoints...")

# 1. Get all universities
results.append(test_endpoint(
    "Get All Universities",
    f"{API_BASE}/api/public/v1/{ORG_SLUG}/posts?post_type=universities&per_page=2",
    headers
))

# 2. Get all programs
results.append(test_endpoint(
    "Get All Programs",
    f"{API_BASE}/api/public/v1/{ORG_SLUG}/posts?post_type=programs&per_page=2",
    headers
))

# 3. Search universities
results.append(test_endpoint(
    "Search Universities (Coventry)",
    f"{API_BASE}/api/public/v1/{ORG_SLUG}/posts?post_type=universities&search=coventry&per_page=5",
    headers
))

# 4. Get single university (Coventry)
results.append(test_endpoint(
    "Get Single University (Coventry)",
    f"{API_BASE}/api/public/v1/{ORG_SLUG}/posts/coventry-university-kazakhstan",
    headers
))

# 5. Get programs by university
results.append(test_endpoint(
    "Get Programs by University",
    f"{API_BASE}/api/public/v1/{ORG_SLUG}/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=5",
    headers
))

# 6. Get taxonomies (disciplines)
results.append(test_endpoint(
    "Get Taxonomies (Disciplines)",
    f"{API_BASE}/api/public/v1/{ORG_SLUG}/taxonomies/disciplines",
    headers
))

# 7. Get organizations (admin)
results.append(test_endpoint(
    "Get Organizations (Admin)",
    f"{API_BASE}/api/admin/v1/organizations",
    headers
))

# 8. Field selection test
results.append(test_endpoint(
    "Field Selection Test",
    f"{API_BASE}/api/public/v1/{ORG_SLUG}/posts?post_type=universities&fields=id,title,slug,customFields&per_page=2",
    headers
))

# Summary
print(f"\n{'='*60}")
print("📊 TEST SUMMARY")
print("="*60)

working = len([r for r in results if r["status"] == "✅ WORKING"])
partial = len([r for r in results if r["status"] == "⚠️ PARTIAL"])
failed = len([r for r in results if r["status"] == "❌ FAILED"])

print(f"✅ Working: {working}")
print(f"⚠️ Partial: {partial}")
print(f"❌ Failed: {failed}")

print("\n📋 DETAILED RESULTS:")
for r in results:
    print(f"\n{r['name']}:")
    print(f"  Status: {r['status']}")
    print(f"  Status Code: {r['status_code']}")
    print(f"  Success: {r['success']}")
    print(f"  Data Count: {r['data_count']}")
    if r['error']:
        print(f"  Error: {r['error']}")

# List failed endpoints
failed_endpoints = [r for r in results if r["status"] == "❌ FAILED"]
if failed_endpoints:
    print("\n❌ FAILED ENDPOINTS:")
    for endpoint in failed_endpoints:
        print(f"\n  - {endpoint['name']}")
        print(f"    URL: {endpoint['url']}")
        print(f"    Error: {endpoint['error']}")
        if endpoint.get('raw_response'):
            print(f"    Response: {endpoint['raw_response'][:200]}")

# List partial endpoints
partial_endpoints = [r for r in results if r["status"] == "⚠️ PARTIAL"]
if partial_endpoints:
    print("\n⚠️ PARTIAL ENDPOINTS (API returned success=false):")
    for endpoint in partial_endpoints:
        print(f"\n  - {endpoint['name']}")
        print(f"    URL: {endpoint['url']}")
        if endpoint.get('raw_response'):
            print(f"    Response: {endpoint['raw_response'][:300]}")

# Save results to file
with open("docs/api/study-in-kazakhstan/endpoint-test-results.json", "w") as f:
    json.dump(results, f, indent=2)

print("\n✅ Results saved to docs/api/study-in-kazakhstan/endpoint-test-results.json")

