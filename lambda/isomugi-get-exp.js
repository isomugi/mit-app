const { DynamoDBClient, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const TableName = "team2_user";

/*** 通常版の解答例(発展課題を含む最終版は下にあります。) ***/
exports.handler = async (event, context) => {
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ message: "" }),
  };
  
  
  // 今回は簡易的な実装だが、一般的にはAuthorizationHeaderの値は、Authorization: <type> <credentials>のような形式になります。
  // https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/Authorization#%E6%A7%8B%E6%96%87
  if (event.headers.authorization !== "mtiToken") {
    response.statusCode = 401;
    response.body = JSON.stringify({
      message: "認証されていません。HeaderにTokenを指定してください",
    });

    return response;
  }

  const body = event.body ? JSON.parse(event.body) : null;
  if (!body || !body.userId || !body.exp) {
    response.statusCode = 400;
    response.body = JSON.stringify({
      message:
        "無効なリクエストです。request bodyに必須パラメータがセットされていません。",
    });

    return response;
  }

  const { userId,exp } = JSON.parse(event.body);
 
  const param = {
    // ↓プロパティ名と変数名が同一の場合は、値の指定を省略できる。
    TableName, 
    Key: marshall({
      userId,
    }),
    ExpressionAttributeNames: {
      "#exp": "exp",
    },
    ExpressionAttributeValues: {
      ":exp": exp,
    },
    UpdateExpression: "SET #exp = :exp",

  };
  
  param.ExpressionAttributeValues = marshall(param.ExpressionAttributeValues)
  
  const command = new UpdateItemCommand(param);
  try{
    await client.send(command);
    response.body = JSON.stringify({userId, exp});
  } catch (e) {
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: "予期せぬエラーが発生しました。",
      errorDetail: e.toString(),
    });
  }

  return response;
};



