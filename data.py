import requests
import json

url = 'https://rss.promediateknologi.id/api/article?apikey=ab37b24adf898610fe572a1a4fd3835668db2581'
next_url = None

while next_url != '':
    response = requests.get(url)
    data = json.loads(response.text)
    next_url = data.get('next_url', '')
    
    if next_url != '':
        # do something with next_url, like print it
        print(next_url)
        
    url = next_url

