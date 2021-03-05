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
  if (status) {
    const responseBody = JSON.stringify(content);
    response = {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: responseBody,
    };
  } else {
    const responseBody = 'Unable to upload the carrierAccount';
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

async function ddbupdate(id, firstname, lastname, phone, email, US_DOT, trailer) {
  let statusCode = 0;
  const params = {
    TableName: process.env.POSTS_TABLE,
    Item: {
      id,
      firstname,
      lastname,
      phone,
      email,
      US_DOT,
      trailer,
    },
  };
  try {
    await documentClient.put(params).promise();
    statusCode = 201;
  } catch (err) {
    statusCode = 403;
  }
  return statusCode;
}

module.exports = {
  getresult,
  ddbupdate,
};

module.exports.postCarrier = async (event) => {
  const {
    id, firstname, lastname, phone, email, US_DOT, trailer,
  } = JSON.parse(event.body);
  const ddbstatus = await ddbupdate(
    id, firstname, lastname, phone, email, US_DOT, trailer,
  );
  const status = ddbstatus < 400;
  const content = {
    id, firstname, lastname, phone, email, US_DOT, trailer,
  };
  const response = getresult(status, content);
  return response;
};
