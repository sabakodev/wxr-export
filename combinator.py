import requests
import json

api_key = "ab37b24adf898610fe572a1a4fd3835668db2581"
latest_id = "7765796"
start_url = f"https://rss.promediateknologi.id/api/article?apikey={api_key}&next={latest_id}"
output_file = "output.json"

results = []
url = start_url

while url:
    response = requests.get(url)
    data = json.loads(response.content)
    result = data.get("result")
    if result:
        results.extend(result.get("data"))
        url = data.get("prev_url")
    print(url)

with open(output_file, "w") as f:
    json.dump(results, f)

print(f"Fetched {len(results)} results and saved to {output_file}")

