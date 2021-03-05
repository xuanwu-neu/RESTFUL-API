const AWS = require('aws-sdk');
const get = require('../lambda/get');

describe('get request basic unit test', () => {
  test('Dynamo is an object', () => {
    expect(typeof get).toBe('object');
  });
  test('get has validid,getfile functions', async () => {
    expect(typeof get.validid).toBe('function');
    expect(typeof get.getAccount).toBe('function');
  });
});

describe('get request getAccount unit test', () => {
  const oldEnv = process.env;
  const validTableName = 'shipperAccount';
  const data = {
    id: '16',
    firstname: 'A',
    lastname: 'B',
    phone: '1',
    email: 'gmail',
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
  test('getAccount is Work', async () => {
    await ddb.put({ TableName: validTableName, Item: data }).promise();
    const { Item } = await ddb.get({
      TableName: validTableName,
      Key: {
        id: '16',
      },
    }).promise();
    expect(Item).toEqual({
      id: '16',
      firstname: 'A',
      lastname: 'B',
      phone: '1',
      email: 'gmail',
    });
  });
});

describe('get request validid unit test', () => {
  const oldEnv = process.env;
  const validTableName = 'shipperAccount';
  const data = {
    id: '16',
    firstname: 'A',
    lastname: 'B',
    phone: '1',
    email: 'gmail',
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
        id: '16',
      },
    }).promise();
    expect(Item).toEqual({
      id: '16',
      firstname: 'A',
      lastname: 'B',
      phone: '1',
      email: 'gmail',
    });
  });
  test('Validaid with correct Account', async () => {
    process.env.POSTS_TABLE = 'shipperAccount';
    expect.assertions(1);
    await expect(get.validid(data.id)).resolves.toBe(true);
  });
  test('Validaid with right Account but not in db', async () => {
    process.env.POSTS_TABLE = 'shipperAccount';
    await expect(get.validid('344')).resolves.toBe(false);
  });
  test('Validaid with incorrect Account', async () => {
    process.env.POSTS_TABLE = 'shipperAccount';
    await expect(get.validid(131)).resolves.toBe(false);
  });
});
