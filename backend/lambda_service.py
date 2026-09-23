import requests

url = "https://3cq2ib0xth.execute-api.us-east-2.amazonaws.com/default/sampleLambda"

response = requests.get(url)

print(response.status_code)
print(response.text)