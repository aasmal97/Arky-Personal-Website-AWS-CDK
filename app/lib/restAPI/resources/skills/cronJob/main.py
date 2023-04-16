import os
import boto3
from boto3.dynamodb.types import TypeDeserializer
from dotenv import load_dotenv
from typing import List, Dict
from linkedin_api import Linkedin

load_dotenv()
deserializer = TypeDeserializer()
# set up DynamoDB client
dynamodb = boto3.client("dynamodb")
# specify table name
table_name = os.getenv("AMAZON_DYNAMO_DB_TABLE_NAME")


def unmarshall(x):
    unmarshalled_item = {}
    for key, value in x.items():
        unmarshalled_item[key] = deserializer.deserialize(value)
    return unmarshalled_item


def get_skills_items() -> List[Dict[str, str]]:
    # define query parameters
    query_params = {
        "TableName": table_name,
        "KeyConditionExpression": "#pk = :pkval",
        "ExpressionAttributeNames": {"#pk": "recordType"},
        "ExpressionAttributeValues": {":pkval": {"S": "skill"}},
    }
    # make the query to DynamoDB and get results
    response = dynamodb.query(**query_params)
    # print all items returned
    items = response["Items"]
    return [unmarshall(x) for x in items]


def create_skill(name: str):
    table = dynamodb.Table(table_name)
    item = {
        "recordType": "skill",
        "name": name,
    }
    response = table.put_item(item)
    return response


def delete_skill(name: str):
    table = dynamodb.Table(table_name)
    response = table.delete_item(
        Key={
            "recordType": "skill",
            "name": name,
        }
    )
    return response


def store_in_db(skills: List[Dict[str, str]]):
    skills_in_db = get_skills_items()
    skills_in_db_hashmap = {d["name"]: d for d in skills_in_db}
    skills_hashmap = {d["name"]: d for d in skills_in_db}
    for skill in skills:
        name = skill["name"]
        if name not in skills_in_db_hashmap:
            create_skill(name)
    for skill in skills_in_db:
        name = skill["name"]
        if name not in skills_hashmap:
            delete_skill(name)
    return skills


def get_skills() -> List[Dict[str, str]]:
    # Authenticate using any Linkedin account credentials
    linkedin_pw = os.getenv("LINKED_IN_PASSWORD")
    api = Linkedin("arkyasmal97@gmail.com", linkedin_pw)
    # GET a profile
    profile_name = "arky-asmal"
    profile_skills = api.get_profile_skills(profile_name)
    return profile_skills


def lambda_handler():
    skills = get_skills()
    store_res = store_in_db(skills)
    return store_res
