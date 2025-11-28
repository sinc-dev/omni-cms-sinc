#!/usr/bin/env python3
import requests
import json
import sys

BASE_URL = "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan"
API_KEY = "omni_099c139e8f5dce0edfc59cc9926d0cd7"
headers = {"Authorization": f"Bearer {API_KEY}"}

results = {}

# Test 1
print("Test 1: Get All Universities")
try:
    r = requests.get(f"{BASE_URL}/posts?post_type=universities&per_page=2", headers=headers, timeout=10)
    results['test1'] = {"status_code": r.status_code, "data": r.json()}
    print(f"  Status: {r.status_code}")
    data = r.json()
    if data.get('success') and data.get('data'):
        print(f"  Items: {len(data['data'])}")
        if data['data'] and 'customFields' in data['data'][0]:
            cf = data['data'][0]['customFields']
            print(f"  Custom Fields: {list(cf.keys()) if cf else 'EMPTY'}")
except Exception as e:
    results['test1'] = {"error": str(e)}
    print(f"  ERROR: {e}")

# Test 2
print("\nTest 2: Get Single University (Coventry)")
try:
    r = requests.get(f"{BASE_URL}/posts/coventry-university-kazakhstan", headers=headers, timeout=10)
    results['test2'] = {"status_code": r.status_code, "data": r.json()}
    print(f"  Status: {r.status_code}")
    data = r.json()
    if data.get('success') and data.get('data'):
        if 'customFields' in data['data']:
            cf = data['data']['customFields']
            print(f"  Custom Fields: {list(cf.keys()) if cf else 'EMPTY'}")
except Exception as e:
    results['test2'] = {"error": str(e)}
    print(f"  ERROR: {e}")

# Test 3
print("\nTest 3: Get All Programs")
try:
    r = requests.get(f"{BASE_URL}/posts?post_type=programs&per_page=2", headers=headers, timeout=10)
    results['test3'] = {"status_code": r.status_code, "data": r.json()}
    print(f"  Status: {r.status_code}")
    data = r.json()
    if data.get('success') and data.get('data'):
        print(f"  Items: {len(data['data'])}")
except Exception as e:
    results['test3'] = {"error": str(e)}
    print(f"  ERROR: {e}")

# Test 4
print("\nTest 4: Get Programs by University")
try:
    r = requests.get(f"{BASE_URL}/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=5", headers=headers, timeout=10)
    results['test4'] = {"status_code": r.status_code, "data": r.json()}
    print(f"  Status: {r.status_code}")
    data = r.json()
    if data.get('success') and data.get('data'):
        print(f"  Items: {len(data['data'])}")
except Exception as e:
    results['test4'] = {"error": str(e)}
    print(f"  ERROR: {e}")

# Test 5
print("\nTest 5: Get Taxonomies (disciplines)")
try:
    r = requests.get(f"{BASE_URL}/taxonomies/disciplines", headers=headers, timeout=10)
    results['test5'] = {"status_code": r.status_code, "data": r.json()}
    print(f"  Status: {r.status_code}")
except Exception as e:
    results['test5'] = {"error": str(e)}
    print(f"  ERROR: {e}")

# Test 6
print("\nTest 6: Get Taxonomies (program-disciplines)")
try:
    r = requests.get(f"{BASE_URL}/taxonomies/program-disciplines", headers=headers, timeout=10)
    results['test6'] = {"status_code": r.status_code, "data": r.json()}
    print(f"  Status: {r.status_code}")
except Exception as e:
    results['test6'] = {"error": str(e)}
    print(f"  ERROR: {e}")

# Save results
with open('api_test_results.json', 'w') as f:
    json.dump(results, f, indent=2)

print("\nResults saved to api_test_results.json")
