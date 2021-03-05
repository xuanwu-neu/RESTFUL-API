const AWS = require('aws-sdk');
const del = require('../lambda/delete');

describe('delete request basic unit test', () => {
  test('delete is an object', () => {
    expect(typeof del).toBe('object');
  });

  test('delete has validid,getfile functions', () => {
    expect(typeof del.ddbupdate).toBe('function');
    expect(typeof del.getresult).toBe('function');
    expect(typeof del.validid).toBe('function');
  });
});

describe('delete request getresult unit test', () => {
  test('All status code responses are valid', () => {
    expect(del.getresult(204)).toEqual({
      statusCode: 204,
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'Successfully Deleted',
    });
  });

  test('status code response with error', () => {
    expect(del.getresult(403)).toEqual({
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'Unable to delete shipperAccount data',
    });
  });
});

describe('delete request dynamoDB unit test', () => {
  const oldEnv = process.env;
  const validTableName = 'shipperAccount';
  const data = {
    id: '15',
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
    process.env.POSTS_TABLE = validTableName;
    await ddb.put({ TableName: validTableName, Item: data }).promise();
    const { Item } = await ddb.get({ TableName: validTableName, Key: { id: '15' } }).promise();
    expect(Item).toEqual({
      id: '15',
      firstname: 'A',
      lastname: 'B',
      phone: '1',
      email: 'gmail',
    });
  });

  test('Validaid with correct format', async () => {
    process.env.POSTS_TABLE = 'shipperAccount';
    expect.assertions(1);
    await expect(del.validid(data.id)).resolves.toBe(true);
  });

  test('Validaid with right format but not in db', async () => {
    expect.assertions(1);
    process.env.POSTS_TABLE = 'shipperAccount';
    await expect(del.validid('1222')).resolves.toBe(false);
  });

  test('Validaid with incorrect format', async () => {
    process.env.POSTS_TABLE = 'shipperAccount';
    await expect(del.validid(1222233)).resolves.toBe(false);
  });

  test('database record gets updated', async () => {
    process.env.POSTS_TABLE = 'shipperAccount';
    await expect(del.ddbupdate('15')).resolves.toBe(204);
  });
});
