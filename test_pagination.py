import requests
import json
import base64

PROJECT_ID = "my-test-project-1"
EMULATOR_HOST = "host.docker.internal:8087"
KIND = "TestKindModel"
NAMESPACE = ""

def run_query(cursor=None):
    url = f"http://{EMULATOR_HOST}/v1/projects/{PROJECT_ID}:runQuery"
    
    query = {
        "kind": [{"name": KIND}],
        "limit": 5
    }
    
    if cursor:
        query["startCursor"] = cursor
        
    payload = {
        "partitionId": {
            "projectId": PROJECT_ID,
            "namespaceId": NAMESPACE,
            "databaseId": ""
        },
        "query": query,
        "databaseId": ""
    }
    
    print(f"\n--- Running Query (Cursor: {cursor[:10] if cursor else 'None'}...) ---")
    response = requests.post(url, json=payload)
    
    if response.status_code != 200:
        print(f"Error {response.status_code}: {response.text}")
        return None, None
        
    data = response.json()
    batch = data.get("batch", {})
    entities = batch.get("entityResults", [])
    end_cursor = batch.get("endCursor")
    more_results = batch.get("moreResults")
    
    print(f"Found {len(entities)} entities.")
    print(f"More results: {more_results}")
    
    return end_cursor, more_results

# Create 15 entities to test pagination
def seed_data():
    print("Seeding data...")
    url = f"http://{EMULATOR_HOST}/v1/projects/{PROJECT_ID}:commit"
    mutations = []
    for i in range(15):
        mutations.append({
            "upsert": {
                "key": {
                    "path": [{"kind": KIND, "name": f"entity-{i}"}],
                    "partitionId": {"projectId": PROJECT_ID, "namespaceId": NAMESPACE}
                },
                "properties": {"val": {"integerValue": str(i)}}
            }
        })
    
    payload = {"mode": "NON_TRANSACTIONAL", "mutations": mutations}
    requests.post(url, json=payload)

seed_data()

# Page 1
cursor1, more1 = run_query()

# Page 2
if cursor1:
    cursor2, more2 = run_query(cursor1)
else:
    print("No cursor returned from Page 1")
