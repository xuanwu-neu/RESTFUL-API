const AWS = require('aws-sdk');
const put = require('../lambda/put');

describe('put request basic unit test', () => {
  test('put is an object', () => {
    expect(typeof put).toBe('object');
  });
  test('put has ddbupdate,getresult,validid,s3update functions', () => {
    expect(typeof put.ddbupdate).toBe('function');
    expect(typeof put.getresult).toBe('function');
    expect(typeof put.validid).toBe('function');
    expect(typeof put.s3update).toBe('function');
  });
});

describe('put request dynamoDB update unit test', () => {
  const oldEnv = process.env;
  const validTableName = 'Document';
  const validbucket = 'documents-service-storage';
  const data = {
    id: 'c48fd833-7f07-4e4f-a996-b8592f3f919f',
    bucket: validbucket,
    doc_name: 'abc.txt',
    key: 'c48fd833-7f07-4e4f-a996-b8592f3f919f.txt',
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
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...oldEnv };
  });
  afterAll(() => {
    process.env = oldEnv;
  });
  test('should insert item into the table', async () => {
    await ddb.put({ TableName: validTableName, Item: data }).promise();
    const { Item } = await ddb.get({ TableName: validTableName, Key: { id: 'c48fd833-7f07-4e4f-a996-b8592f3f919f' } }).promise();
    expect(Item).toEqual({
      id: 'c48fd833-7f07-4e4f-a996-b8592f3f919f',
      bucket: validbucket,
      doc_name: 'abc.txt',
      key: 'c48fd833-7f07-4e4f-a996-b8592f3f919f.txt',
      lastupdated: '2020-08-04T21:17:29.261Z',
    });
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
    await expect(put.ddbupdate('c48fd833-7f07-4e4f-a996-b8592f3f919f', 'update.txt')).resolves.toBe(201);
    const { Item } = await ddb.get({ TableName: validTableName, Key: { id: 'c48fd833-7f07-4e4f-a996-b8592f3f919f' } }).promise();
    expect(Item).toEqual({
      id: 'c48fd833-7f07-4e4f-a996-b8592f3f919f',
      bucket: validbucket,
      doc_name: 'update.txt',
      key: 'c48fd833-7f07-4e4f-a996-b8592f3f919f.txt',
      lastupdated: '2020-08-07T10:20:30.000Z',
    });
    global.Date = RealDate;
  }, 30000);
});
describe('put request getresult function unit test', () => {
  test('All status code response with no error', () => {
    expect(put.getresult(true, { test: 'body_content' })).toEqual({
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{"test":"body_content"}',
    });
  });
  test('All status code response with error', () => {
    expect(put.getresult(false, { test: 'body_content' })).toEqual({
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'Unable to upload the file',
    });
  });
});
describe('put request validid function unit test', () => {
  const oldEnv = process.env;
  const validTableName = 'Document';
  const validbucket = 'documents-service-storage';
  const data = {
    id: 'f48fd833-7f07-4e4f-a996-b8592f3f919f',
    bucket: validbucket,
    doc_name: 'abc.txt',
    key: 'f48fd833-7f07-4e4f-a996-b8592f3f919f.txt',
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
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...oldEnv };
  });
  afterAll(() => {
    process.env = oldEnv;
  });
  test('should insert item into the table', async () => {
    await ddb.put({ TableName: validTableName, Item: data }).promise();
    const { Item } = await ddb.get({ TableName: validTableName, Key: { id: 'f48fd833-7f07-4e4f-a996-b8592f3f919f' } }).promise();
    expect(Item).toEqual({
      id: 'f48fd833-7f07-4e4f-a996-b8592f3f919f',
      bucket: validbucket,
      doc_name: 'abc.txt',
      key: 'f48fd833-7f07-4e4f-a996-b8592f3f919f.txt',
      lastupdated: '2020-08-04T21:17:29.261Z',
    });
  });
  test('Validaid with correct format', async () => {
    process.env.ddb_table = validTableName;
    expect.assertions(1);
    await expect(put.validid(data.id)).resolves.toBe(true);
  });
  test('Validaid with right format but not in db', async () => {
    process.env.ddb_table = validTableName;
    await expect(put.validid('048fd833-7f07-4e4f-a996-b8592f3f919f')).resolves.toBe(false);
  });
  test('Validaid with incorrect format', async () => {
    process.env.ddb_table = validTableName;
    await expect(put.validid('12344')).resolves.toBe(false);
  });
});
describe('put request S3 update function unit test', () => {
  const oldEnv = process.env;
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
  const validbucket = 'documents-service-storage';

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...oldEnv };
  });
  afterAll(() => {
    process.env = oldEnv;
  });
  test('putobject in bucket', async () => {
    await s3.putObject({
      Bucket: validbucket,
      Key: '1234',
      Body: 'abcd',
    }).promise();
    const file = await s3.getObject({ Bucket: validbucket, Key: '1234' }).promise();
    expect(file.Body.toString()).toBe('abcd');
  });
  test('update the file content in bucket', async () => {
    process.env.bucket = validbucket;
    await expect(put.s3update('1234', 'Update test')).resolves.toBe(201);
    const file = await s3.getObject({ Bucket: validbucket, Key: '1234' }).promise();
    expect(file.Body.toString()).toBe('Update test');
  });
});
