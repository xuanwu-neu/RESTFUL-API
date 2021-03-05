const AWS = require('aws-sdk');
const del = require('../lambda/delete');
const eventGenerator = require('../testUtil/eventGenerator');
const validators = require('../testUtil/validators');

describe('delete intergation test', () => {
  const oldEnv = process.env;
  const validbucket = 'documents-service-storage';
  const validTableName = 'Document';
  const data = {
    id: 'b48fd833-7f07-4e4f-a996-b8592f3f919f',
    bucket: 'documents-service-storage',
    doc_name: 'abc.txt',
    key: 'b48fd833-7f07-4e4f-a996-b8592f3f919f.txt',
    lastupdated: '2020-08-04T21:17:29.261Z',
  };
  const isTest = process.env.JEST_WORKER_ID;
  const config = {
    convertEmptyValues: true,
    ...(isTest && {
      endpoint: 'localhost:4570',
      sslEnabled: false,
      region: 'local-env',
    }),
  };
  const ddb = new AWS.DynamoDB.DocumentClient(config);
  const option = {
    ...(isTest && {
      s3ForcePathStyle: true,
      accessKeyId: 'S3RVER', // This specific key is required when working offline
      secretAccessKey: 'S3RVER',
      endpoint: new AWS.Endpoint('http://localhost:4569'),
    }),
  };
  const s3 = new AWS.S3(option);
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...oldEnv };
  });

  afterAll(() => {
    process.env = oldEnv;
  });
  test('It should take a body and return API Gateway response', async () => {
    const event = eventGenerator({
      pathParametersObject: {
        id: '1234',
      },
    });
    const res = await del.deleteDocumentbyId(event);
    expect(res).toBeDefined();
    expect(validators.isApiGatewayResponse(res)).toBe(true);
  });

  test('Prep - Should insert element into Table', async () => {
    await ddb.put({ TableName: validTableName, Item: data }).promise();
    const { Item } = await ddb.get({
      TableName: validTableName,
      Key: {
        id: 'b48fd833-7f07-4e4f-a996-b8592f3f919f',
      },
    }).promise();
    expect(Item).toEqual({
      id: 'b48fd833-7f07-4e4f-a996-b8592f3f919f',
      bucket: validbucket,
      doc_name: 'abc.txt',
      key: 'b48fd833-7f07-4e4f-a996-b8592f3f919f.txt',
      lastupdated: '2020-08-04T21:17:29.261Z',
    });
  });

  test('prep delete object in bucket', async () => {
    await s3.putObject({
      Bucket: validbucket,
      Key: 'b48fd833-7f07-4e4f-a996-b8592f3f919f.txt',
      Body: 'content',
    }).promise();
    const file = await s3.getObject({
      Bucket: validbucket,
      Key: 'b48fd833-7f07-4e4f-a996-b8592f3f919f.txt',
    }).promise();
    expect(file.Body.toString()).toBe('content');
  });

  test('delete request integration test', async () => {
    const event = eventGenerator({
      pathParametersObject: {
        id: 'b48fd833-7f07-4e4f-a996-b8592f3f919f',
      },
    });
    process.env.ddb_table = validTableName;
    process.env.bucket = validbucket;
    const res = await del.deleteDocumentbyId(event);
    expect(res).toBeDefined();
    expect(res).toHaveProperty('statusCode', 204);
    expect(res).toHaveProperty('headers', { 'Content-Type': 'application/json' });
    expect(res).toHaveProperty('body', 'Successfully Deleted');
  });

  test('delete request integration test with invalid id', async () => {
    const event = eventGenerator({
      pathParametersObject: {
        id: 'g48fd833-7f07-4e4f-a996-b8592f3f919f',
      },
    });
    process.env.ddb_table = validTableName;
    process.env.bucket = validbucket;
    const res = await del.deleteDocumentbyId(event);
    expect(res).toBeDefined();
    expect(res).toHaveProperty('statusCode', 404);
    expect(res).toHaveProperty('headers', { 'Content-Type': 'application/json' });
    expect(res).toHaveProperty('body', 'Invalid ID');
  });
});
