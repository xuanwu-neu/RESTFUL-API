const AWS = require('aws-sdk');
const get = require('../lambda/get');

describe('get request basic unit test', () => {
  test('get is an object', () => {
    expect(typeof get).toBe('object');
  });
  test('get has validid,getfile,gets3params functions', async () => {
    expect(typeof get.validid).toBe('function');
    expect(typeof get.getfile).toBe('function');
    expect(typeof get.gets3params).toBe('function');
  });
});

describe('get request validid unit test', () => {
  const oldEnv = process.env;
  const validbucket = 'documents-service-storage';
  const validTableName = 'Document';
  const data = {
    id: 'd48fd833-7f07-4e4f-a996-b8592f3f919f',
    bucket: 'documents-service-storage',
    doc_name: 'abc.txt',
    key: 'd48fd833-7f07-4e4f-a996-b8592f3f919f.txt',
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
    const { Item } = await ddb.get({
      TableName: validTableName,
      Key: {
        id: 'd48fd833-7f07-4e4f-a996-b8592f3f919f',
      },
    }).promise();
    expect(Item).toEqual({
      id: 'd48fd833-7f07-4e4f-a996-b8592f3f919f',
      bucket: validbucket,
      doc_name: 'abc.txt',
      key: 'd48fd833-7f07-4e4f-a996-b8592f3f919f.txt',
      lastupdated: '2020-08-04T21:17:29.261Z',
    });
  });
  test('Validaid with correct format', async () => {
    process.env.ddb_table = 'Document';
    expect.assertions(1);
    await expect(get.validid(data.id)).resolves.toBe(true);
  });
  test('Validaid with right format but not in db', async () => {
    process.env.ddb_table = 'Document';
    await expect(get.validid('048fd833-7f07-4e4f-a996-b8592f3f919f')).resolves.toBe(false);
  });
  test('Validaid with incorrect format', async () => {
    process.env.ddb_table = 'Document';
    await expect(get.validid('12344')).resolves.toBe(false);
  });
});

describe('get request gets3param unit test', () => {
  const oldEnv = process.env;
  const validbucket = 'documents-service-storage';
  const validTableName = 'Document';
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...oldEnv };
  });
  afterAll(() => {
    process.env = oldEnv;
  });
  test('Get S3 parameters from database', async () => {
    process.env.ddb_table = validTableName;
    await expect(get.gets3params('d48fd833-7f07-4e4f-a996-b8592f3f919f')).resolves.toEqual({
      Bucket: validbucket,
      Key: 'd48fd833-7f07-4e4f-a996-b8592f3f919f.txt',
    });
  });
});

describe('get request getfile unit test', () => {
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
  test('putobject in bucket', async () => {
    await s3.putObject({
      Bucket: validbucket,
      Key: 'test1',
      Body: 'abcd',
    }).promise();
    const file = await s3.getObject({
      Bucket: validbucket,
      Key: 'test1',
    }).promise();
    expect(file.Body.toString()).toBe('abcd');
  });
  test('putobject in bucket', async () => {
    const response = await (get.getfile({
      Bucket: validbucket,
      Key: 'test1',
    }, 'test1'));
    expect(response).toHaveProperty('statusCode', 200);
    expect(response).toHaveProperty('headers', { 'Content-Type': 'application/json' });
    expect(response).toHaveProperty('body');
  });
});
