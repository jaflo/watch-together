import json
import boto3
import os

dynamodb = boto3.client("dynamodb")


def connect(event, context):
    connectionId = event["requestContext"]["connectionId"]
    dynamodb.put_item(TableName=os.environ["SOCKET_CONNECTIONS"],
                      Item={"connectionId": {"S": connectionId}})

    return {}


def disconnect(event, context):
    connectionId = event["requestContext"]["connectionId"]
    dynamodb.delete_item(TableName=os.environ["SOCKET_CONNECTIONS"],
                         Key={"connectionId": {"S": connectionId}})

    return {}


def message(event, context):
    message = json.loads(event["body"])["message"]
    paginator = dynamodb.get_paginator("scan")
    connectionIds = []
    apigatewaymanagementapi = boto3.client("apigatewaymanagementapi",
                                           endpoint_url="https://" +
                                           event["requestContext"]["domainName"] + "/" +
                                           event["requestContext"]["stage"])

    for page in paginator.paginate(TableName=os.environ["SOCKET_CONNECTIONS"]):
        connectionIds.extend(page["Items"])

    for connectionId in connectionIds:
        try:
            apigatewaymanagementapi.post_to_connection(
                Data=message,
                ConnectionId=connectionId["connectionId"]["S"]
            )
        except:
            pass

    return {}
