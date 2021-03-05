<!--
title: Document Service REST API 
description: This section is a breif description about deployment of Document Service REST API using Serverless Framework
layout: Doc
framework: v1
platform: AWS
language: nodeJS
authorName: Yi 
-->

# Introduction 

Document Service API allows user to upload and modify document.

# Feature

This API provides get, delete, update, and post API request. In this repository, 
it allows to deploy all the API and lambda functions onto AWS.

# Serverless Framework Deployment

Move to the directory where serverless.yml file located and run the following commands:

serverless config credentials --provider aws --key <key> --secret <secret key>
serverless deploy

deploy.sh can be used to deploy the API onto AWS. 
Run the command: 

./deploy.sh 

This will deploy the API setting onto AWS. 

swagger_doc.sh is a script created for exporting Swagger documentation file from AWS. 
Run the command: 

./swagger_doc.sh <FILENAME> 


This will generate a swagger file with the given name in swagger_yaml directory. 

# Model Description 

create_request.json file is a model used when making a POST request. This model will validate if the body input is matching with this format. 

put_request.json file is a model used when making a PUT request. This model will validate if the body input is matching with this format. 

output.json file is the format that is used as output when making POST,PUT,GET request.


# Serverless Unit Tests and Integration Tests

startOffline.sh is used to start dynamodb local and S3 bucket local before running unit testing and integration testing. The setting is based on the setting in serverless.yml. 
Move to the directory and run the command: 
./startOffline.sh 

This will start dynamodb local and s3 bucket local based on the configuration given in serverless.yml and jest dynamodb table config file. 

stopOffline.sh is used to stop dynamodb local and s3 bucket local and clean up the files generated after running unit test files or integration tests. 

Move to the directory and run the command: 
./stopOffline.sh
