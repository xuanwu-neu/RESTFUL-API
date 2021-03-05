const AWS = require('aws-sdk');
const post = require('../lambda/post');

describe('post request basic unit test', () => {
  test('post is an object', () => {
    expect(typeof post).toBe('object');
  });
  test('post has ddbupdate,getresult,s3update functions', () => {
    expect(typeof post.ddbupdate).toBe('function');
    expect(typeof post.getresult).toBe('function');
    expect(typeof post.s3update).toBe('function');
  });
});
describe('put request getresult unit test', () => {
  test('All status code response with no error', () => {
    expect(post.getresult(true, { test: 'body_content' })).toEqual({
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{"test":"body_content"}',
    });
  });
  test('All status code response with error', () => {
    expect(post.getresult(false, { test: 'body_content' })).toEqual({
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'Unable to upload the file',
    });
  });
});

describe('post request DynamoDB Update unit test', () => {
  const oldEnv = process.env;
  const validTableName = 'Document';
  const validbucket = 'documents-service-storage';
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
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...oldEnv };
  });
  afterAll(() => {
    process.env = oldEnv;
  });
  test('Database update sucessfully', async () => {
    const RealDate = Date;
    global.Date = class extends RealDate {
      constructor() {
        return new RealDate('2020-08-07T10:20:30.000Z');
      }
    };
    const time = new Date('2020-08-07T10:20:30.000Z').getTime();
    expect(new Date().getTime()).toBe(time);
    process.env.ddb_table = validTableName;
    process.env.bucket = validbucket;
    await expect(post.ddbupdate('a48fd833-7f07-4e4f-a996-b8592f3f919f', 'post.txt')).resolves.toBe(201);
    const { Item } = await ddb.get({ TableName: validTableName, Key: { id: 'a48fd833-7f07-4e4f-a996-b8592f3f919f' } }).promise();
    expect(Item).toMatchObject({
      bucket: validbucket,
      doc_name: 'post.txt',
      lastupdated: '2020-08-07T10:20:30.000Z',
    });
    global.Date = RealDate;
  }, 30000);
});

describe('post request S3 Update unit test', () => {
  const oldEnv = process.env;
  const validbucket = 'documents-service-storage';
  const isTest = process.env.JEST_WORKER_ID;
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
  test('s3 update successfully', async () => {
    process.env.bucket = validbucket;
    await expect(post.s3update('123456', 'update test')).resolves.toBe(201);
    const file = await s3.getObject({ Bucket: validbucket, Key: '123456' }).promise();
    expect(file.Body.toString()).toBe('update test');
  });
});
