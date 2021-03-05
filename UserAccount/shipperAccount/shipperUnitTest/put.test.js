const AWS = require('aws-sdk');
const put = require('../lambda/put');

describe('put request basic unit test', () => {
  test('put is an object', () => {
    expect(typeof put).toBe('object');
  });

  test('put has ddbupdate,getresult,validid functions', () => {
    expect(typeof put.ddbupdate).toBe('function');
    expect(typeof put.getresult).toBe('function');
    expect(typeof put.validid).toBe('function');
  });
});

describe('put request dynamoDB update unit test', () => {
  const oldEnv = process.env;
  const validTableName = 'shipperAccount';
  const data = {
    id: '756',
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
    const { Item } = await ddb.get({ TableName: validTableName, Key: { id: '756' } }).promise();
    expect(Item).toEqual({
      id: '756',
      firstname: 'A',
      lastname: 'B',
      phone: '1',
      email: 'gmail',
    });
  });

  test('Database update sucessfully', async () => {
    process.env.POSTS_TABLE = validTableName;
    await expect(put.ddbupdate('756', 'firstname', 'SD')).resolves.toBe(201);
    const { Item } = await ddb.get({ TableName: validTableName, Key: { id: '756' } }).promise();
    expect(Item).toEqual({
      id: '756',
      firstname: 'SD',
      lastname: 'B',
      phone: '1',
      email: 'gmail',
    });
  });
});

describe('put request getresult function unit test', () => {
  const oldEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...oldEnv };
  });

  afterAll(() => {
    process.env = oldEnv;
  });

  test('All status code response with no error', () => {
    expect(put.getresult(true, { id: '756', paramName: 'fristname', paramValue: 'SD' })).toEqual({
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{"id":"756","paramName":"fristname","paramValue":"SD"}',
    });
  });

  test('All status code response with error', () => {
    expect(put.getresult(false, { id: '722', paramName: 'fristname', paramValue: 'SD' })).toEqual({
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'Unable to update the Account',
    });
  });
});

describe('put request validid function unit test', () => {
  const oldEnv = process.env;
  const validTableName = 'shipperAccount';
  const data = {
    id: '12',
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
    const { Item } = await ddb.get({ TableName: validTableName, Key: { id: '12' } }).promise();
    expect(Item).toEqual({
      id: '12',
      firstname: 'A',
      lastname: 'B',
      phone: '1',
      email: 'gmail',
    });
  });

  test('Validaid with correct format', async () => {
    process.env.POSTS_TABLE = validTableName;
    expect.assertions(1);
    await expect(put.validid(data.id)).resolves.toBe(true);
  });

  test('Validaid with right format but not in db', async () => {
    process.env.POSTS_TABLE = validTableName;
    await expect(put.validid('222111')).resolves.toBe(false);
  });

  test('Validaid with incorrect format', async () => {
    process.env.POSTS_TABLE = validTableName;
    await expect(put.validid(213123)).resolves.toBe(false);
  });
});
