#!/bin/bash 

#For setup credential to deploy the API
#npx serverless config credentials --provider aws --key $AWS_ACCESS_KEY_ID --secret $AWS_SECRET_ACCESS_KEY
#echo $AWS_ACCESS_KEY_ID
#echo $AWS_SECRET_ACCESS_KEY

npx serverless config credentials --provider aws --key $AWS_ACCESS_KEY_ID_WX --secret $AWS_SECRET_ACCESS_KEY_WX

# Deploy API onto AWS
npx serverless deploy
