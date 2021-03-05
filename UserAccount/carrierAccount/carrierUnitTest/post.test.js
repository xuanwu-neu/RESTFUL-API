const AWS = require('aws-sdk');
const post = require('../lambda/post');

describe('post request basic unit test', () => {
  test('put is an object', () => {
    expect(typeof post).toBe('object');
  });

  test('post has ddbupdate,getresult functions', () => {
    expect(typeof post.ddbupdate).toBe('function');
    expect(typeof post.getresult).toBe('function');
  });
});

describe('put request getresult unit test', () => {
  test('All status code response with no error', () => {
    expect(post.getresult(true, {
      id: '7', firstname: 'Ted', lastname: 'IM', phone: '12', email: 'gmail', US_DOT: '1', trailer: 'A',
    })).toEqual({
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{"id":"7","firstname":"Ted","lastname":"IM","phone":"12","email":"gmail","US_DOT":"1","trailer":"A"}',
    });
  });

  test('All status code response with error', () => {
    expect(post.getresult(false, {
      id: '7', firstname: 'Ted', lastname: 'IM', phone: '12', email: 'gmail', US_DOT: '1', trailer: 'A',
    })).toEqual({
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'Unable to upload the carrierAccount',
    });
  });
});

describe('post request DynamoDB Update unit test', () => {
  const oldEnv = process.env;
  const validTableName = 'carrierAccount';
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

  test('DynamoDB update sucessfully', async () => {
    process.env.POSTS_TABLE = validTableName;
    await expect(post.ddbupdate('7', 'Ted', 'IM', '12', 'gmail', '1', 'A')).resolves.toBe(201);
    const { Item } = await ddb.get({ TableName: validTableName, Key: { id: '7' } }).promise();
    expect(Item).toMatchObject({
      id: '7',
      firstname: 'Ted',
      lastname: 'IM',
      phone: '12',
      email: 'gmail',
      US_DOT: '1',
      trailer: 'A',
    });
  });
});
