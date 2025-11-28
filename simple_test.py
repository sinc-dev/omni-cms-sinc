import requests
import json

url = "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=universities&per_page=2"
headers = {"Authorization": "Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"}

r = requests.get(url, headers=headers)
print(f"Status: {r.status_code}")
print(f"Response: {json.dumps(r.json(), indent=2)}")
