Introduction
UserAccount Service API allows user to create and modify their account information.

Feature
This API provides get, delete, update, and post API request. In this repository,
it allows to deploy all the API and lambda functions onto AWS.

Serverless Framework Deployment
Move to the directory where serverless.yml file located and run the following commands:
serverless config credentials --provider aws --key  --secret 
serverless deploy

swagger_doc.sh is a script created for exporting Swagger documentation file from AWS.
Run the command:
serverless downloadDocumentation --outputFileName=$1
mv $1 swagger_yaml

This will generate a swagger file with the given name in swagger_yaml directory.

Model Description
create_request.json file is a model used when making a POST request. This model will validate if the body input is matching with this format.
put_request.json file is a model used when making a PUT request. This model will validate if the body input is matching with this format.


