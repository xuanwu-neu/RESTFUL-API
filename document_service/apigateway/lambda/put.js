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
    responseBody = 'Unable to upload the file';
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
  const currentDate = new Date();
  const time = currentDate.toISOString();

  const params = {
    TableName: process.env.ddb_table,
    Key: {
      id,
    },
    UpdateExpression: 'set doc_name = :d, lastupdated = :t',
    ExpressionAttributeValues: {
      ':d': name,
      ':t': time,
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

async function s3update(key, body) {
  let statusCode = 0;

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

async function validid(id) {
  let exists = false;
  if (
    typeof id === 'string'
    && id.match(
      '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    )
  ) {
    const params = {
      TableName: process.env.ddb_table,
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

async function getresponse(id, name, body) {
  const valid = await validid(id);
  let ddbstatus = '';
  let s3status = '';
  let response = '';
  if (valid) {
    ddbstatus = await ddbupdate(id, name);
    const key = id.toString() + name.slice(name.lastIndexOf('.'));
    s3status = await s3update(key, body);
    const status = s3status < 400 && ddbstatus < 400;
    const content = { id, body };
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
  s3update,
  ddbupdate,
};

module.exports.putDocumentbyId = async (event) => {
  const { id, name, body } = JSON.parse(event.body);
  const response = await getresponse(id, name, body);
  return response;
};
