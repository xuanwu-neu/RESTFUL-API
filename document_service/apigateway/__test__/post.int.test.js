const AWS = require('aws-sdk');
const post = require('../lambda/post');
const eventGenerator = require('../testUtil/eventGenerator');
const validators = require('../testUtil/validators');

describe('post intergation test', () => {
  const oldEnv = process.env;
  const validbucket = 'documents-service-storage';
  const validTableName = 'Document';
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
      body: {
        name: 'test.txt',
        body: 'test',
      },
    });
    const context = {
      awsRequestId: '12345',
    };
    const res = await post.postDocument(event, context);
    expect(res).toBeDefined();
    expect(validators.isApiGatewayResponse(res)).toBe(true);
  });

  test('integration test for post', async () => {
    const event = eventGenerator({
      body: {
        name: 'integration.txt',
        body: 'integration content',
      },
    });
    const context = {
      awsRequestId: 'abcde',
    };
    process.env.ddb_table = validTableName;
    process.env.bucket = validbucket;
    const res = await post.postDocument(event, context);
    expect(res).toBeDefined();
    expect(res).toHaveProperty('statusCode', 201);
    expect(res).toHaveProperty('headers', { 'Content-Type': 'application/json' });
    expect(res).toHaveProperty('body');
    const { Item } = await ddb.get({ TableName: validTableName, Key: { id: 'abcde' } }).promise();
    expect(Item).toHaveProperty('bucket', validbucket);
    expect(Item).toHaveProperty('doc_name', 'integration.txt');
    expect(Item).toHaveProperty('lastupdated');
    const file = await s3.getObject({ Bucket: validbucket, Key: 'abcde.txt' }).promise();
    expect(file.Body.toString()).toBe('integration content');
  });
});
