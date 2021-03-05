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
const error = -1;

function getURL(params) {
  const url = s3.getSignedUrl('getObject', params);
  return url;
}

async function getfile(s3param, id) {
  let statusCode = 0;
  let responseBody = '';
  try {
    const file = await s3.getObject(s3param).promise();
    const url = getURL(s3param);
    const content = file.Body.toString();
    responseBody = JSON.stringify({ id, body: content, link: url });
    statusCode = 200;
  } catch (err) {
    responseBody = 'Unable to read file data';
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

async function gets3params(id) {
  let s3param = error;
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
    s3param = error;
  }

  const bucket = data.Item.bucket.toString();
  const key = data.Item.key.toString();

  s3param = {
    Bucket: bucket,
    Key: key,
  };
  return s3param;
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
  const valid = await validid(id);
  if (valid) {
    const s3param = await gets3params(id);
    if (s3param === error) {
      response = {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'Unable to read the file',
      };
    } else {
      response = await getfile(s3param, id);
    }
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
  gets3params,
  getfile,
};

module.exports.getDocumentbyId = async (event) => {
  const { id } = event.pathParameters;
  const response = await getresponse(id);
  return response;
};
