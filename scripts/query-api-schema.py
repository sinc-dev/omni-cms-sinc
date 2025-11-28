#!/usr/bin/env python3
"""
Script to query the study-in-kazakhstan API and analyze schema
API Key: omni_099c139e8f5dce0edfc59cc9926d0cd7
"""

import json
import requests
import os
from pathlib import Path

API_BASE = "https://omni-cms-api.joseph-9a2.workers.dev"
API_KEY = "omni_099c139e8f5dce0edfc59cc9926d0cd7"
ORG_SLUG = "study-in-kazakhstan"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Create docs directory
docs_dir = Path("docs/api/study-in-kazakhstan")
docs_dir.mkdir(parents=True, exist_ok=True)

def save_json(filename, data):
    """Save data to JSON file"""
    filepath = docs_dir / filename
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"💾 Saved to {filepath}")

print("🔍 Querying API Schema...\n")

# 1. Get organizations
print("1. Getting organizations...")
try:
    response = requests.get(f"{API_BASE}/api/admin/v1/organizations", headers=headers)
    orgs_data = response.json()
    if orgs_data.get('success') and orgs_data.get('data'):
        org = next((o for o in orgs_data['data'] if o.get('slug') == ORG_SLUG), None)
        if org:
            org_id = org['id']
            print(f"✅ Found organization: {org['name']} (ID: {org_id})\n")
        else:
            org_id = None
            print("⚠️ Organization not found in list, will use public endpoints\n")
    else:
        org_id = None
        print("⚠️ Could not get organizations, will use public endpoints\n")
except Exception as e:
    print(f"❌ Error getting organizations: {e}\n")
    org_id = None

# 2. Get full schema
if org_id:
    print("2. Getting full schema...")
    try:
        response = requests.get(f"{API_BASE}/api/admin/v1/organizations/{org_id}/schema", headers=headers)
        schema_data = response.json()
        if schema_data.get('success') and schema_data.get('data'):
            schema = schema_data['data']
            print(f"Post Types: {len(schema.get('postTypes', []))}")
            print(f"Taxonomies: {len(schema.get('taxonomies', []))}\n")
            
            print("📋 Post Types Found:")
            for pt in schema.get('postTypes', []):
                field_count = len(pt.get('availableFields', []))
                print(f"  - {pt.get('name')} ({pt.get('slug')}) - {field_count} custom fields")
            
            universities_type = next((pt for pt in schema.get('postTypes', []) 
                if pt.get('slug') in ['universities', 'university'] or 'university' in pt.get('name', '').lower()), None)
            programs_type = next((pt for pt in schema.get('postTypes', []) 
                if pt.get('slug') in ['programs', 'program'] or 'program' in pt.get('name', '').lower()), None)
            
            if universities_type:
                print(f"\n✅ Universities Post Type: {universities_type.get('name')} ({universities_type.get('slug')})")
                print(f"   Custom Fields: {len(universities_type.get('availableFields', []))}")
            
            if programs_type:
                print(f"✅ Programs Post Type: {programs_type.get('name')} ({programs_type.get('slug')})")
                print(f"   Custom Fields: {len(programs_type.get('availableFields', []))}")
            
            save_json("schema-full.json", schema)
    except Exception as e:
        print(f"❌ Error getting schema: {e}\n")

# 3. Get universities
print("\n3. Getting universities from public API...")
try:
    response = requests.get(f"{API_BASE}/api/public/v1/{ORG_SLUG}/posts?post_type=universities&per_page=5", headers=headers)
    unis_data = response.json()
    if unis_data.get('success'):
        total = unis_data.get('meta', {}).get('total', 0)
        print(f"Found {total} universities")
        if unis_data.get('data') and len(unis_data['data']) > 0:
            first_uni = unis_data['data'][0]
            print(f"\nExample University: {first_uni.get('title')} ({first_uni.get('slug')})")
            custom_fields = first_uni.get('customFields', {})
            print(f"Custom Fields: {', '.join(custom_fields.keys()) if custom_fields else 'None'}")
            save_json("universities-example.json", unis_data)
except Exception as e:
    print(f"❌ Error getting universities: {e}")

# 4. Find Coventry University
print("\n4. Searching for Coventry University...")
coventry = None
try:
    response = requests.get(f"{API_BASE}/api/public/v1/{ORG_SLUG}/posts?post_type=universities&search=coventry&per_page=10", headers=headers)
    coventry_data = response.json()
    if coventry_data.get('success') and coventry_data.get('data'):
        coventry = next((u for u in coventry_data['data'] 
            if 'coventry' in u.get('slug', '').lower() or 'coventry' in u.get('title', '').lower()), None)
        if coventry:
            print(f"\n✅ Found: {coventry.get('title')} ({coventry.get('slug')})")
            print(f"All fields: {', '.join(coventry.keys())}")
            save_json("coventry-university-example.json", coventry)
except Exception as e:
    print(f"❌ Error searching for Coventry: {e}")

# 5. Get programs for Coventry
if coventry:
    print(f"\n5. Getting programs for {coventry.get('title')}...")
    try:
        coventry_slug = coventry.get('slug')
        response = requests.get(
            f"{API_BASE}/api/public/v1/{ORG_SLUG}/posts?post_type=programs&related_to_slug={coventry_slug}&relationship_type=university&per_page=5",
            headers=headers
        )
        programs_data = response.json()
        if programs_data.get('success'):
            total = programs_data.get('meta', {}).get('total', 0)
            print(f"Found {total} programs")
            if programs_data.get('data') and len(programs_data['data']) > 0:
                first_program = programs_data['data'][0]
                print(f"\nExample Program: {first_program.get('title')}")
                custom_fields = first_program.get('customFields', {})
                print(f"Custom Fields: {', '.join(custom_fields.keys()) if custom_fields else 'None'}")
                save_json("coventry-programs-example.json", programs_data)
    except Exception as e:
        print(f"❌ Error getting programs: {e}")

# 6. Get taxonomies
print("\n6. Getting taxonomies...")
taxonomy_slugs = ["disciplines", "program-disciplines", "categories", "program-categories"]
for tax_slug in taxonomy_slugs:
    try:
        response = requests.get(f"{API_BASE}/api/public/v1/{ORG_SLUG}/taxonomies/{tax_slug}", headers=headers)
        if response.status_code == 200:
            tax_data = response.json()
            if tax_data.get('success'):
                print(f"✅ Found taxonomy: {tax_slug}")
                terms_count = len(tax_data.get('data', {}).get('terms', []))
                print(f"   Terms: {terms_count}")
                save_json(f"taxonomy-{tax_slug}.json", tax_data)
                break
    except:
        continue

print("\n✅ Analysis complete!")

