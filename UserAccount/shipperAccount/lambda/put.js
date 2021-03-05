const AWS = require('aws-sdk');

const isTest = process.env.JEST_WORKER_ID;
const config = {
  convertEmptyValues: true,
  ...(isTest && {
    endpoint: 'localhost:4570',
    sslEnabled: false,
    region: 'local-env',
  }),
};

const documentClient = new AWS.DynamoDB.DocumentClient(config);
function getresult(status, content) {
  let response = '';
  let responseBody = '';
  if (status) {
    responseBody = JSON.stringify(content);
    response = {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: responseBody,
    };
  } else {
    responseBody = 'Unable to update the Account';
    response = {
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json',
      },
      body: responseBody,
    };
  }
  return response;
}

async function ddbupdate(id, paramName, paramValue) {
  let statusCode = 0;

  const params = {
    Key: {
      id,
    },
    TableName: process.env.POSTS_TABLE,
    ConditionExpression: 'attribute_exists(id)',
    UpdateExpression: `set ${paramName} = :v`,
    ExpressionAttributeValues: {
      ':v': paramValue,
    },
    ReturnValues: 'UPDATED_NEW',
  };
  try {
    await documentClient.update(params).promise();
    statusCode = 201;
  } catch (err) {
    statusCode = 403;
  }
  return statusCode;
}

async function validid(id) {
  let exists = false;
  if (
    typeof id === 'string') {
    const params = {
      TableName: process.env.POSTS_TABLE,
      Key: {
        id,
      },
    };
    const result = await documentClient.get(params).promise();
    if (result.Item !== undefined && result.Item !== null) {
      exists = true;
    }
  }
  return exists;
}

async function getresponse(id, paramName, paramValue) {
  const valid = await validid(id);
  let ddbstatus = '';
  let response = '';
  if (valid) {
    ddbstatus = await ddbupdate(id, paramName, paramValue);
    const status = ddbstatus < 400;
    const content = { id, paramName, paramValue };
    response = getresult(status, content);
  } else {
    response = {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'Invalid ID',
    };
  }
  return response;
}

module.exports = {
  getresult,
  validid,
  ddbupdate,
};

module.exports.putShipperbyId = async (event) => {
  const { id, paramName, paramValue } = JSON.parse(event.body);
  const response = await getresponse(id, paramName, paramValue);
  return response;
};
