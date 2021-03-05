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

async function getAccount(id) {
  let statusCode = 0;
  let responseBody = '';
  const params = {
    TableName: process.env.POSTS_TABLE,
    FilterExpression: '#cat = :cat',
    ExpressionAttributeNames: {
      '#cat': 'id',
    },
    ExpressionAttributeValues: {
      ':cat': id,
    },
  };

  try {
    const data = await documentClient.scan(params).promise();
    responseBody = JSON.stringify(data.Items);
    statusCode = 200;
  } catch (err) {
    responseBody = 'Unable to get carrierAccount';
    statusCode = 403;
  }

  const response = {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: responseBody,
  };
  return response;
}

async function validid(id) {
  let exists = false;
  if (typeof id === 'string') {
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

async function getresponse(id) {
  let response = '';
  const valid = await validid(id);
  if (valid) {
    response = await getAccount(id);
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
  validid,
  getAccount,
};

module.exports.getCarrierbyId = async (event) => {
  const { id } = JSON.parse(event.body);
  const response = await getresponse(id);
  return response;
};
