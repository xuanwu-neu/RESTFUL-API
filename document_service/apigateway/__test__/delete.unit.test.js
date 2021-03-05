const AWS = require('aws-sdk');
const del = require('../lambda/delete');

describe('delete request basic unit test', () => {
  test('delete is an object', () => {
    expect(typeof del).toBe('object');
  });
  test('delete has validid,getfile,gets3params functions', () => {
    expect(typeof del.ddbupdate).toBe('function');
    expect(typeof del.getresult).toBe('function');
    expect(typeof del.s3update).toBe('function');
    expect(typeof del.validid).toBe('function');
  });
});

describe('delete request getresult unit test', () => {
  test('All status code responses are valid', () => {
    expect(del.getresult(200, 201)).toEqual({
      statusCode: 204,
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'Successfully Deleted',
    });
  });
  test('All status code response with error', () => {
    expect(del.getresult(401, 201)).toEqual({
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'Unable to delete document data',
    });
  });
  test('All status code response with error', () => {
    expect(del.getresult(201, 400)).toEqual({
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'Unable to delete document data',
    });
  });
});

describe('delete request dynamoDB & S3 unit test', () => {
  const oldEnv = process.env;
  const validTableName = 'Document';
  const data = {
    id: 'e48fd833-7f07-4e4f-a996-b8592f3f919f',
    bucket: 'documents-service-storage',
    doc_name: 'abc.txt',
    key: 'e48fd833-7f07-4e4f-a996-b8592f3f919f.txt',
    lastupdated: '2020-08-04T21:17:29.261Z',
  };
  const isTest = process.env.JEST_WORKER_ID;
  const config = {
    convertEmptyValues: true,
    ...(isTest && {
      endpoint: 'localhost:4570',
      sslEnabled: false,
      region: 'documents-service-storage',
    }),
  };
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
  const s3Data = {
    id: 's3test',
    bucket: 'documents-service-storage',
    doc_name: 'abc.txt',
    key: 's3test.txt',
    lastupdated: '2020-08-04T21:17:29.261Z',
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
    const { Item } = await ddb.get({ TableName: validTableName, Key: { id: 'e48fd833-7f07-4e4f-a996-b8592f3f919f' } }).promise();
    expect(Item).toEqual({
      id: 'e48fd833-7f07-4e4f-a996-b8592f3f919f',
      bucket: 'documents-service-storage',
      doc_name: 'abc.txt',
      key: 'e48fd833-7f07-4e4f-a996-b8592f3f919f.txt',
      lastupdated: '2020-08-04T21:17:29.261Z',
    });
  }, 30000);
  test('Validaid with correct format', async () => {
    process.env.ddb_table = 'Document';
    expect.assertions(1);
    await expect(del.validid(data.id)).resolves.toBe(true);
  });
  test('Validaid with right format but not in db', async () => {
    expect.assertions(1);
    process.env.ddb_table = 'Document';
    await expect(del.validid('048fd833-7f07-4e4f-a996-b8592f3f919f')).resolves.toBe(false);
  });
  test('Validaid with incorrect format', async () => {
    process.env.ddb_table = 'Document';
    await expect(del.validid('12344')).resolves.toBe(false);
  });
  test('database record gets updated', async () => {
    process.env.ddb_table = 'Document';
    await expect(del.ddbupdate('e48fd833-7f07-4e4f-a996-b8592f3f919f')).resolves.toBe(204);
  });
  test('should insert item into the table', async () => {
    await ddb.put({ TableName: validTableName, Item: s3Data }).promise();
    const { Item } = await ddb.get({ TableName: validTableName, Key: { id: 's3test' } }).promise();
    expect(Item).toEqual({
      id: 's3test',
      bucket: validbucket,
      doc_name: 'abc.txt',
      key: 's3test.txt',
      lastupdated: '2020-08-04T21:17:29.261Z',
    });
  });
  test('putobject in local-bucket', async () => {
    await s3.putObject({
      Bucket: validbucket,
      Key: 's3test.txt',
      Body: 'abcd',
    }).promise();
    const file = await s3.getObject({ Bucket: validbucket, Key: 's3test.txt' }).promise();
    expect(file.Body.toString()).toBe('abcd');
  });
  test('delete S3 bucket test', async () => {
    process.env.ddb_table = 'Document';
    await expect(del.s3update('s3test')).resolves.toBe(200);
  });
});
