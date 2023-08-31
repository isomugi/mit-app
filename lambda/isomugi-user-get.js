const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const TableName = "team2-user";

/*** 通常版の解答例(発展課題を含む最終版は下にあります。) ***/
exports.handler = async (event, context) => {
  //レスポンスの雛形
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ message: "" }),
  };

  const userId = event.queryStringParameters.userId; //見たいユーザのuserId

  const param = {
    TableName,
    Key: marshall({
      userId,
    }),
  };

  const command = new GetItemCommand(param);

  //GetItemCommandの実行でDBからデータを取得
  try {
    const user = (await client.send(command)).Item;
    delete user?.password;

    response.body = JSON.stringify(unmarshall(user));
  } catch (e) {
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: "予期せぬエラーが発生しました。",
      errorDetail: e.toString(),
    });
  }

  return response;
};

/*** 発展課題も含む最終版 ***/
exports.handler = async (event, context) => {
  //レスポンスの雛形
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

  // ?.でアクセスすることをオプショナルチェーンと呼び、nullかundefinedの時は、Errorが起きる代わりにundefinedを返す。
  // プロパティの事前チェックが不要になる。(https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Optional_chaining)
  const userId = event.queryStringParameters?.userId; //見たいユーザのuserId
  if (!userId) {
    response.statusCode = 400;
    response.body = JSON.stringify({
      message:
        "無効なリクエストです。クエリストリングに必須パラメータがセットされていません。",
    });

    return response;
  }

  const param = {
    TableName,
    Key: marshall({
      userId,
    }),
  };

  const command = new GetItemCommand(param);

  //GetItemCommandの実行でDBからデータを取得
  try {
    const user = (await client.send(command)).Item;
    if (!user) {
      throw new Error("指定されたuserIdを持つuserは見つかりません");
    }

    delete user.password;
    response.body = JSON.stringify(unmarshall(user));
  } catch (e) {
    if (e.message == "指定されたuserIdを持つuserは見つかりません") {
      response.statusCode = 404;
      response.body = JSON.stringify({
        message: e.message,
      });
    } else {
      response.statusCode = 500;
      response.body = JSON.stringify({
        message: "予期せぬエラーが発生しました。",
        errorDetail: e.toString(),
      });
    }
  }

  return response;
};
