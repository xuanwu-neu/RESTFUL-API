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
    accessKeyId: 'S3RVER',
    secretAccessKey: 'S3RVER',
    endpoint: new AWS.Endpoint('http://localhost:4569'),
  }),
};
const s3 = new AWS.S3(option);

function getresult(s3status, ddbstatus) {
  let responseBody = '';
  let statusCode = 0;
  let response = '';

  if (s3status < 400 && ddbstatus < 400) {
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
    responseBody = 'Unable to delete document data';
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

async function ddbupdate(id) {
  const params = {
    TableName: process.env.ddb_table,
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

async function s3update(id) {
  let statusCode = 0;

  const params = {
    TableName: process.env.ddb_table,
    Key: {
      id,
    },
  };
  let data = 0;
  try {
    data = await documentClient.get(params).promise();
  } catch (err) {
    statusCode = 403;
  }

  const bucket = data.Item.bucket.toString();
  const key = data.Item.key.toString();

  const s3param = {
    Bucket: bucket,
    Key: key,
  };
  try {
    await s3.deleteObject(s3param).promise();
    statusCode = 200;
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

async function getresponse(id) {
  let response = '';
  let s3status = '';
  let ddbstatus = '';
  const valid = await validid(id);
  if (valid) {
    s3status = await s3update(id);
    ddbstatus = await ddbupdate(id);
    response = getresult(s3status, ddbstatus);
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
  s3update,
};

module.exports.deleteDocumentbyId = async (event) => {
  const { id } = event.pathParameters;
  const response = await getresponse(id);
  return response;
};
