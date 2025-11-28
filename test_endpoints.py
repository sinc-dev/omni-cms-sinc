#!/usr/bin/env python3
"""
Test Study in Kazakhstan API Endpoints
"""
import requests
import json
from typing import Dict, Any

BASE_URL = "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan"
API_KEY = "omni_099c139e8f5dce0edfc59cc9926d0cd7"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def test_endpoint(name: str, url: str, method: str = "GET") -> Dict[str, Any]:
    """Test an endpoint and return results"""
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"URL: {url}")
    print(f"{'='*60}")
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        else:
            response = requests.post(url, headers=headers, timeout=10)
        
        print(f"HTTP Status: {response.status_code}")
        
        try:
            data = response.json()
            print(f"Success: {data.get('success', 'N/A')}")
            
            if data.get('success'):
                if 'data' in data:
                    if isinstance(data['data'], list):
                        print(f"Items returned: {len(data['data'])}")
                        if len(data['data']) > 0:
                            first_item = data['data'][0]
                            print(f"First item keys: {list(first_item.keys())}")
                            if 'customFields' in first_item:
                                print(f"Custom fields: {list(first_item['customFields'].keys()) if first_item['customFields'] else 'EMPTY'}")
                    elif isinstance(data['data'], dict):
                        print(f"Data keys: {list(data['data'].keys())}")
                        if 'customFields' in data['data']:
                            print(f"Custom fields: {list(data['data']['customFields'].keys()) if data['data']['customFields'] else 'EMPTY'}")
                    if 'meta' in data:
                        print(f"Meta: {data['meta']}")
            else:
                print(f"Error: {data.get('error', {})}")
            
            # Pretty print first 500 chars of response
            response_str = json.dumps(data, indent=2)
            if len(response_str) > 500:
                print(f"\nResponse (first 500 chars):\n{response_str[:500]}...")
            else:
                print(f"\nResponse:\n{response_str}")
            
            return {
                "status": "success" if response.status_code == 200 else "failed",
                "http_code": response.status_code,
                "data": data
            }
        except json.JSONDecodeError:
            print(f"Response (not JSON): {response.text[:500]}")
            return {
                "status": "error",
                "http_code": response.status_code,
                "data": response.text
            }
            
    except requests.exceptions.RequestException as e:
        print(f"ERROR: {str(e)}")
        return {
            "status": "error",
            "error": str(e)
        }

def main():
    """Run all endpoint tests"""
    results = {}
    
    print("\n" + "="*60)
    print("Study in Kazakhstan API Endpoint Tests")
    print("="*60)
    
    # Test 1: Get All Universities
    results['universities'] = test_endpoint(
        "Get All Universities",
        f"{BASE_URL}/posts?post_type=universities&per_page=2"
    )
    
    # Test 2: Get Single University (Coventry)
    results['single_university'] = test_endpoint(
        "Get Single University (Coventry)",
        f"{BASE_URL}/posts/coventry-university-kazakhstan"
    )
    
    # Test 3: Get All Programs
    results['programs'] = test_endpoint(
        "Get All Programs",
        f"{BASE_URL}/posts?post_type=programs&per_page=2"
    )
    
    # Test 4: Get Programs by University
    results['programs_by_university'] = test_endpoint(
        "Get Programs by University",
        f"{BASE_URL}/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=5"
    )
    
    # Test 5: Get Taxonomies (disciplines)
    results['taxonomies_disciplines'] = test_endpoint(
        "Get Taxonomies (disciplines)",
        f"{BASE_URL}/taxonomies/disciplines"
    )
    
    # Test 6: Get Taxonomies (program-disciplines)
    results['taxonomies_program_disciplines'] = test_endpoint(
        "Get Taxonomies (program-disciplines)",
        f"{BASE_URL}/taxonomies/program-disciplines"
    )
    
    # Test 7: Get Programs by Discipline
    results['programs_by_discipline'] = test_endpoint(
        "Get Programs by Discipline",
        f"{BASE_URL}/taxonomies/disciplines/engineering/posts?post_type=programs&per_page=5"
    )
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    for name, result in results.items():
        status = result.get('status', 'unknown')
        http_code = result.get('http_code', 'N/A')
        status_icon = "✅" if status == "success" and http_code == 200 else "❌"
        print(f"{status_icon} {name}: {status} (HTTP {http_code})")
    
    print("\n" + "="*60)
    
    # Save detailed results as JSON
    with open('endpoint_test_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print("\nDetailed results saved to: endpoint_test_results.json")

if __name__ == "__main__":
    main()
