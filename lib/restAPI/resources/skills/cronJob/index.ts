import {
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  QueryCommandInput,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import axios from "axios";
import { SkillsType } from "@app/types";
import {
  AMAZON_DYNAMO_DB_SKILLS_TABLE_ENV_NAME,
  SKILLS_DB_DEFAULT_PK_KEY,
  SKILLS_DB_DEFAULT_SORT_KEY,
} from "@lib/constants";
type DataFuncsParams = Pick<SkillsType, "order"> & {
  skillName: SkillsType[typeof SKILLS_DB_DEFAULT_SORT_KEY];
};
const tableName = process.env[AMAZON_DYNAMO_DB_SKILLS_TABLE_ENV_NAME];

const client = new DynamoDBClient({
  region: "us-east-1",
});
const createSkill = async ({ skillName, order }: DataFuncsParams) => {
  const currentTimestamp = Date.now();
  const item = {
    [SKILLS_DB_DEFAULT_PK_KEY]: "skill",
    [SKILLS_DB_DEFAULT_SORT_KEY]: skillName,
    date_created: currentTimestamp.toString(),
    order,
  };
  const putCommand = new PutItemCommand({
    TableName: tableName,
    Item: marshall(item, {
      convertClassInstanceToMap: true,
      removeUndefinedValues: true,
    }),
  });
  return await client.send(putCommand);
};
const deleteSkill = async (skillName: string) => {
  const deleteCommand = new DeleteItemCommand({
    TableName: tableName,
    Key: marshall(
      {
        [SKILLS_DB_DEFAULT_PK_KEY]: "skill",
        [SKILLS_DB_DEFAULT_SORT_KEY]: skillName,
      },
      {
        convertClassInstanceToMap: true,
        removeUndefinedValues: true,
      }
    ),
  });
  return await client.send(deleteCommand);
};
const updateSkill = async ({ skillName, order }: DataFuncsParams) => {
  const updateCommand = new UpdateItemCommand({
    TableName: tableName,
    Key: marshall(
      {
        [SKILLS_DB_DEFAULT_PK_KEY]: "skill",
        [SKILLS_DB_DEFAULT_SORT_KEY]: skillName,
      },
      {
        convertClassInstanceToMap: true,
        removeUndefinedValues: true,
      }
    ),
    UpdateExpression: "SET #order = :order",
    ExpressionAttributeNames: {
      "#order": "order",
    },
    ExpressionAttributeValues: marshall(
      {
        ":order": order,
      },
      {
        convertClassInstanceToMap: true,
        removeUndefinedValues: true,
      }
    ),
  });
  return await client.send(updateCommand);
};

const getSkillsInDynamoDbTable = async () => {
  //create query command
  const expValMap = {
    ":skill": "skill",
  };
  const expVal = marshall(expValMap, {
    convertClassInstanceToMap: true,
    removeUndefinedValues: true,
  });
  const query: QueryCommandInput = {
    TableName: tableName,
    KeyConditionExpression: "#rt = :skill",
    ExpressionAttributeNames: {
      "#rt": SKILLS_DB_DEFAULT_PK_KEY,
    },
    ExpressionAttributeValues: expVal,
  };
  //send command
  const command = new QueryCommand(query);
  const response = await client.send(command);
  const items = response.Items;
  if (!items) return [];
  const newItems = items.map((i) => unmarshall(i)) as SkillsType[];
  return newItems;
};
const getLinkedInSkills = async () => {
  try {
    const req = await axios({
      method: "GET",
      url: `https://nubela.co/proxycurl/api/v2/linkedin`,
      headers: {
        Authorization: `Bearer ${process.env.PROXYCURL_TOKEN}`,
      },
      params: {
        url: "https://linkedin.com/in/arky-asmal/",
        fallback_to_cache: "on-error",
        use_cache: "if-recent",
        skills: "include",
      },
    });
    const data = req.data || {};
    if (!data.skills) return [];
    const linkedInSkills = data.skills as string[];
    return linkedInSkills;
  } catch (err) {
    return [];
  }
};
const storeInDatabase = async (skills: string[]) => {
  const skillsInDB = await getSkillsInDynamoDbTable();
  const skillsInDBMap: Record<string, SkillsType> = Object.assign(
    {},
    ...skillsInDB.map((val) => ({ [val.name]: val }))
  );
  const skillsInLinkedInMap: Record<
    string,
    Pick<SkillsType, "name" | "order">
  > = Object.assign(
    {},
    ...skills.map((val, idx) => ({
      [val]: {
        order: idx,
        name: val,
      },
    }))
  );
  //loop through linkedin skills
  const modifyPromiseArr = skills.map((val, idx) => {
    //check if creation is needed
    const skillName = val;
    if (!(skillName in skillsInDBMap))
      return createSkill({
        skillName,
        order: idx,
      });
    //check if update needed
    const storedIdx = skillsInDBMap[skillName].order;
    const parsedIdx =
      typeof storedIdx === "string" ? parseInt(storedIdx) : storedIdx;
    if (parsedIdx === idx) return null;
    return updateSkill({
      skillName,
      order: idx,
    });
  });
  //check if deletion is needed
  //loop through skill in database already
  const deletePromiseArr = skillsInDB.map((val) => {
    const skillName = val.name;
    if (!(skillName in skillsInLinkedInMap)) return deleteSkill(skillName);
    return null;
  });
  const results = await Promise.all([...modifyPromiseArr, ...deletePromiseArr]);
  return results;
};

export async function handler() {
  const linkedInSkills = await getLinkedInSkills();
  //this means failure, as LinkedIn skills will never be at zero
  if (linkedInSkills.length <= 0) return;
  const res = storeInDatabase(linkedInSkills);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Successfully got LinkedIn skills",
    }),
  };
}
