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
      id: '17', firstname: 'A', lastname: 'B', phone: '1', email: 'gmail',
    })).toEqual({
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{"id":"17","firstname":"A","lastname":"B","phone":"1","email":"gmail"}',
    });
  });

  test('All status code response with error', () => {
    expect(post.getresult(false, {
      id: '17', firstname: 'Ted', lastname: 'IM', phone: '12', email: 'gmail',
    })).toEqual({
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'Unable to upload the shipperAccount',
    });
  });
});

describe('post request DynamoDB Update unit test', () => {
  const oldEnv = process.env;
  const validTableName = 'shipperAccount';
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
    await expect(post.ddbupdate('17', 'A', 'B', '1', 'gmail')).resolves.toBe(201);
    const { Item } = await ddb.get({ TableName: validTableName, Key: { id: '17' } }).promise();
    expect(Item).toMatchObject({
      id: '17',
      firstname: 'A',
      lastname: 'B',
      phone: '1',
      email: 'gmail',
    });
  });
});
