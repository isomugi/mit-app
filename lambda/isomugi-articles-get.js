const { DynamoDBClient,  QueryCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const TableName = "team2-article";

exports.handler = async (event, context) => {
  //レスポンスの雛形
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ message: "" }),
  };
  
  if (event.headers.authorization !== "mtiToken") {
    response.statusCode = 401;
    response.body = JSON.stringify({
      message: "認証されていません。HeaderにTokenを指定してください",
    });
  }
  
  const userId = event.queryStringParameters?.userId;
  let param = []
  let flag = false;
  
  //ユーザーIDが無効な場合
  if(!userId){
    param = {
      TableName, 
      Limit: 100,
    }
    flag=true;
  }
  
  //ユーザーIDが有効な場合
  else{
    const { userId, start, end, category } = event.queryStringParameters;
    
    param = {
      TableName,
      Limit: 100,
      ExpressionAttributeNames:{
          '#u': 'userId',
          '#t': 'timestamp',
      },
      ExpressionAttributeValues:{
          ':userId': userId,
          //startが無効な場合は0以上とする
          ':start' : Number.isNaN(parseInt(start)) ? 0 : parseInt(start),
          //endが無効な場合は現在時刻以下とする
          ':end' :Number.isNaN(parseInt(end)) ? Date.now() : parseInt(end),
      },
      KeyConditionExpression: '#u = :userId and #t BETWEEN :start AND :end',
    };
    
    //カテゴリ指定がある場合
    if (category) {
      param.ExpressionAttributeValues[":category"] = category;
      param.FilterExpression = "category = :category";
    }
    
    param.ExpressionAttributeValues = marshall(param.ExpressionAttributeValues)
  }

  

  // 指定したアイテムを取得するコマンドを用意
  const scanCommand = new ScanCommand(param);
  const queryCommand = new QueryCommand(param);

  try {
    //client.send()の実行でDBからデータを取得
    //ユーザーIDがなく無効なパラメータの場合は全件取得
      const article = flag 
      ? (await client.send(scanCommand)).Items
      : (await client.send(queryCommand)).Items;
    
    //指定されたパラメータの記事が存在しない場合
    if (article?.length === 0){
      response.body = JSON.stringify({ articles: [] });
    }
    else{
      const unmarshalledArticles = article.map((item) => unmarshall(item));
      unmarshalledArticles.sort((a, b) => b.timestamp - a.timestamp);
      response.body = JSON.stringify({ articles: unmarshalledArticles });
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
