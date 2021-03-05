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

async function ddbupdate(id) {
  const params = {
    TableName: process.env.POSTS_TABLE,
    Key: {
      id,
    },
  };

  let statusCode = 0;

  try {
    await documentClient.delete(params).promise();
    statusCode = 204;
  } catch (err) {
    statusCode = 403;
  }
  return statusCode;
}

function getresult(ddbstatus) {
  let responseBody = '';
  let statusCode = 0;
  let response = '';

  if (ddbstatus < 400) {
    statusCode = 204;
    responseBody = 'Successfully Deleted';
    response = {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
      body: responseBody,
    };
  } else {
    statusCode = 403;
    responseBody = 'Unable to delete carrierAccount data';
    response = {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
      body: responseBody,
    };
  }
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
  let ddbstatus = '';
  const valid = await validid(id);
  if (valid) {
    ddbstatus = await ddbupdate(id);
    response = getresult(ddbstatus);
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
  ddbupdate,
  validid,
};

module.exports.deleteCarrierbyId = async (event) => {
  const { id } = JSON.parse(event.body);
  const response = await getresponse(id);
  return response;
};
