const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const TableName = "User";

/*** 通常版の解答例(発展課題を含む最終版は下にあります。) ***/
exports.handler = async (event, context) => {
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ message: "" }),
  };

  const param = {
    // ↓プロパティ名と変数名が同一の場合は、値の指定を省略できる。
    TableName, // TableName: TableNameと同じ意味
  };

  const command = new ScanCommand(param);

  try {
    const users = (await client.send(command)).Items;

    // ?.でアクセスすることをオプショナルチェーンと呼び、nullかundefinedの時は、Errorが起きる代わりにundefinedを返す。
    // プロパティの事前チェックが不要になる。(https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Optional_chaining)
    users?.forEach((item) => delete item?.password);
    const unmarshalledUsersItems = users.map((item) => unmarshall(item));
    response.body = JSON.stringify({ users: unmarshalledUsersItems });
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

  const param = {
    // ↓プロパティ名と変数名が同一の場合は、値の指定を省略できる。
    TableName, // TableName: TableNameと同じ意味
  };

  const command = new ScanCommand(param);

  try {
    const users = (await client.send(command)).Items;
    if (users.length == 0) {
      response.body = JSON.stringify({ users: [] });
    } else {
      // ?.でアクセスすることをオプショナルチェーンと呼び、nullかundefinedの時は、Errorが起きる代わりにundefinedを返す。
      // プロパティの事前チェックが不要になる。(https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Optional_chaining)
      users.forEach((item) => delete item?.password);
      const unmarshalledUsersItems = users.map((item) => unmarshall(item));
      response.body = JSON.stringify({ users: unmarshalledUsersItems });
    }
  } catch (e) {
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: "予期せぬエラーが発生しました。",
      errorDetail: e.toString(),
    });
  }

  return response;
};
