#!/usr/bin/env python3
"""Test Study in Kazakhstan API Endpoints"""
import requests
import json
from pathlib import Path

BASE_URL = "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan"
API_KEY = "omni_099c139e8f5dce0edfc59cc9926d0cd7"
headers = {"Authorization": f"Bearer {API_KEY}"}

output = []
results = {}

def test(name, url):
    output.append(f"\n{'='*70}")
    output.append(f"TEST: {name}")
    output.append(f"URL: {url}")
    output.append(f"{'='*70}")
    
    try:
        r = requests.get(url, headers=headers, timeout=10)
        result = {
            "name": name,
            "url": url,
            "status_code": r.status_code,
            "success": r.status_code == 200
        }
        
        output.append(f"HTTP Status: {r.status_code}")
        
        try:
            data = r.json()
            result["response"] = data
            
            if data.get('success'):
                output.append("✓ SUCCESS")
                if 'data' in data:
                    if isinstance(data['data'], list):
                        output.append(f"  Items returned: {len(data['data'])}")
                        if data['data']:
                            item = data['data'][0]
                            output.append(f"  First item has keys: {list(item.keys())[:10]}")
                            if 'customFields' in item:
                                cf = item['customFields']
                                output.append(f"  Custom Fields: {list(cf.keys()) if cf else 'EMPTY ⚠️'}")
                    elif isinstance(data['data'], dict):
                        output.append(f"  Data keys: {list(data['data'].keys())[:10]}")
                        if 'customFields' in data['data']:
                            cf = data['data']['customFields']
                            output.append(f"  Custom Fields: {list(cf.keys()) if cf else 'EMPTY ⚠️'}")
                if 'meta' in data:
                    output.append(f"  Meta: {data['meta']}")
            else:
                output.append("✗ FAILED")
                if 'error' in data:
                    output.append(f"  Error: {data['error']}")
        except:
            result["response"] = r.text[:500]
            output.append(f"  Response (not JSON): {r.text[:200]}")
        
        return result
        
    except Exception as e:
        output.append(f"✗ ERROR: {str(e)}")
        return {"name": name, "url": url, "error": str(e), "success": False}

# Run tests
output.append("STUDY IN KAZAKHSTAN API ENDPOINT TESTS")
output.append("="*70)

results['1'] = test(
    "Get All Universities",
    f"{BASE_URL}/posts?post_type=universities&per_page=2"
)

results['2'] = test(
    "Get Single University (Coventry)",
    f"{BASE_URL}/posts/coventry-university-kazakhstan"
)

results['3'] = test(
    "Get All Programs",
    f"{BASE_URL}/posts?post_type=programs&per_page=2"
)

results['4'] = test(
    "Get Programs by University",
    f"{BASE_URL}/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=5"
)

results['5'] = test(
    "Get Taxonomies (disciplines)",
    f"{BASE_URL}/taxonomies/disciplines"
)

results['6'] = test(
    "Get Taxonomies (program-disciplines)",
    f"{BASE_URL}/taxonomies/program-disciplines"
)

# Summary
output.append(f"\n{'='*70}")
output.append("SUMMARY")
output.append(f"{'='*70}")

for key, result in results.items():
    status = "✓" if result.get('success') else "✗"
    code = result.get('status_code', 'N/A')
    output.append(f"{status} Test {key}: {result.get('name')} - HTTP {code}")

# Write output
output_text = '\n'.join(output)
print(output_text)

# Save files
base_path = Path(__file__).parent
with open(base_path / 'test_results.txt', 'w', encoding='utf-8') as f:
    f.write(output_text)

with open(base_path / 'test_results.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"\n\nResults saved to:")
print(f"  - test_results.txt")
print(f"  - test_results.json")
