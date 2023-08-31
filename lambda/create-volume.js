const { DynamoDBClient, PutItemCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const TableName = "team2_user";


exports.handler = async (event, context) => {
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ message: "" }),
  };

  const body = event.body ? JSON.parse(event.body) : null;
  if (!body ||!body.userId || !body.volume) {
    response.statusCode = 400;
    response.body = JSON.stringify({
      message:
        "無効なリクエストです。request bodyに必須パラメータがセットされていません。",
    });

    return response;
  }

  const { userId, volume } = body;
  const param = {
    // ↓プロパティ名と変数名が同一の場合は、値の指定を省略できる。
    TableName, 
    Key: marshall({
      userId,
    }),
    ExpressionAttributeNames: {
      "#volume": "volume",
    },
    ExpressionAttributeValues: {
      ":volume": volume,
    },
    UpdateExpression: "SET #volume = :volume",

  };
  
  param.ExpressionAttributeValues = marshall(param.ExpressionAttributeValues)
  
  const command = new UpdateItemCommand(param);

  try {
    await client.send(command);
    response.body = JSON.stringify({userId, volume});
  } catch (e) {
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: "予期せぬエラーが発生しました。",
      errorDetail: e.toString(),
    });
  }

  return response;
};
