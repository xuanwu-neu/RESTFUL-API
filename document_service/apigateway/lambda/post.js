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
const option = {
  ...(isTest && {
    s3ForcePathStyle: true,
    accessKeyId: 'S3RVER', // This specific key is required when working offline
    secretAccessKey: 'S3RVER',
    endpoint: new AWS.Endpoint('http://localhost:4569'),
  }),
};
const s3 = new AWS.S3(option);
// const ddbtable = process.env.ddb_table;
// const { bucket } = process.env;

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
    const responseBody = 'Unable to upload the file';
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

async function ddbupdate(id, name) {
  let statusCode = 0;
  const key = id.toString() + name.slice(name.lastIndexOf('.'));

  // Timestamp Format Setup
  const currentDate = new Date();
  const time = currentDate.toISOString();

  const params = {
    TableName: process.env.ddb_table,
    Item: {
      id,
      doc_name: name,
      bucket: process.env.bucket,
      key,
      lastupdated: time,
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

async function s3update(key, body) {
  let statusCode = 0;
  // Key is a combination of generated ID and document type to
  //  ensure that the filename will not have conflict with other files in s3 bucket
  const s3params = {
    Bucket: process.env.bucket,
    Key: key,
    Body: body,
  };

  try {
    await s3.putObject(s3params).promise();
    statusCode = 201;
  } catch (err) {
    statusCode = 403;
  }
  return statusCode;
}

module.exports = {
  getresult,
  ddbupdate,
  s3update,
};

module.exports.postDocument = async (event, context) => {
  const { name, body } = JSON.parse(event.body);
  // Generating UUID assigned to documents
  const id = context.awsRequestId;
  const key = id.toString() + name.slice(name.lastIndexOf('.'));
  const s3status = await s3update(key, body);
  const ddbstatus = await ddbupdate(id, name);
  const status = s3status < 400 && ddbstatus < 400;
  const content = { id, body };
  const response = getresult(status, content);
  return response;
};
