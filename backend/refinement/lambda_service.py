import requests
import boto3


url = "https://3cq2ib0xth.execute-api.us-east-2.amazonaws.com/default/sampleLambda"
sqs = boto3.client('sqs')

#Queue
queue_url = "https://sqs.us-east-2.amazonaws.com/034317881183/sampleQueue"

response = sqs.send_message(QueueUrl = queue_url, MessageBody="Hello Hello Hello World")

print("Message Sent")








