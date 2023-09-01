#!/bin/bash

name=$(cat yourname.env | sed s/YOURNAME=//)

writename(){
    if [ "$(ls lambda/ | grep "${name}")" ]; then
        echo "既にあなたの名前に変わっているため、変更は行いません"
    else
        cd lambda
        for jsf in *.js
        do
            mv "${jsf}" "${name}-${jsf}"
        done
        echo "ファイル名の変更が完了しました"
        cd ..
    fi
}

lambda_deploy() {
        
    # ファイル名が未指定の場合は処理を中断します。
    if [ $# -lt 1 ]; then
        echo "デプロイしたいファイル名を指定しましょう Usage: ./utils.sh lambda_deploy <FILENAME>"
        exit 1
    fi
    
    filename=$1
    if [ "$(ls lambda/ | grep -x "${filename}")" ]; then
        echo "関数${filename}の処理を開始します"
    else
        # 指定したファイル名が存在しない場合は処理を中断します。
        echo "${filename}はlambda/配下に存在しないようです 存在するファイル名を指定しましょう"
        exit 1
    fi
    
    cd lambda
    funame=$(echo $filename | sed s/.js//)
    aws lambda get-function --function-name $funame > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        # functionが存在している時
        echo "関数${funame}の内容を更新します"
        zip -r ${funame}.zip ${filename}
        aws lambda update-function-code  --function-name ${funame} \
        --zip-file fileb://${funame}.zip
        rm ${funame}.zip
            
    else
        # functionが存在していない時
        echo "関数${funame}のデプロイを開始します"
        zip -r ${funame}.zip ${filename}
        aws lambda create-function  --function-name ${funame} \
        --runtime nodejs18.x \
        --role arn:aws:iam::387258525885:role/cloud9-mti-role \
        --handler ${funame}.handler  --zip-file fileb://${funame}.zip \
        --region ap-northeast-1
        rm ${funame}.zip
    fi
    cd ..
    
}

lambda_deploy_all(){

    for lambdaf in lambda/*.js
    do
        # lambda_deployはファイル名を引数として受け取る想定のため、不要な"lambda/"を取り除いています
        filename=$(echo $lambdaf | sed "s/lambda\///")
        lambda_deploy $filename
    done
    cd ..
}

s3_deploy(){
    sudo yum -y install jq
    
    bucket_name="isomugi-mti"
    
    policy=$(printf '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::%s/*"
            }
        ]
    }' ${bucket_name} | jq .)

    aws s3api create-bucket \
        --bucket "${bucket_name}" \
        --region "ap-northeast-1" \
        --create-bucket-configuration "LocationConstraint=ap-northeast-1"
    
    aws s3api put-public-access-block \
        --bucket "${bucket_name}" \
        --public-access-block-configuration "BlockPublicPolicy=false"

    aws s3api put-bucket-policy \
        --bucket "${bucket_name}" \
        --policy "${policy}"
}

s3_update(){
    npm run build
    aws s3 cp ./dist s3://isomugi-test --recursive
}

deletename(){
    cd lambda
    for noname in *.js
    do
        blankp=$(echo ${noname} | sed s/${name}-//)
        mv "${noname}" "${blankp}"
    done
    echo "名前を削除しました"
    cd ..
}

case $1 in
    "") writename;;
    lambda_deploy_all) lambda_deploy_all;;
    lambda_deploy) lambda_deploy $2;;
    s3_deploy) s3_deploy;;
    s3_update) s3_update;;
    delete_name) deletename;;
esac
