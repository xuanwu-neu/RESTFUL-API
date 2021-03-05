const AWS = require('aws-sdk');
const put = require('../lambda/put');
const validators = require('./testUtils/validators');
const eventGenerator = require('./testUtils/eventGenerator');

describe('put API function integration test', () => {
  test('it should take  body and eturn an API Gateway response', async () => {
    const oldEnv = process.env;
    const validTableName = 'carrierAccount';
    const data = {
      id: '4',
      firstname: 'A',
      lastname: 'B',
      phone: '1',
      email: 'gmail',
      US_DOT: '1',
      trailer: '12',
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
    process.env.POSTS_TABLE = validTableName;
    await ddb.put({ TableName: validTableName, Item: data }).promise();
    process.env.POSTS_TABLE = validTableName;
    const event = eventGenerator({
      body: {
        id: '4',
        paramName: 'firstname',
        paramValue: 'sd',
      },
    });
    const res = await put.putCarrierbyId(event);
    expect(res).toBeDefined();
    expect(validators.isApiGetwayResponse(res)).toBe(true);
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body)).toEqual({
      id: '4', paramName: 'firstname', paramValue: 'sd',
    });
  });
});
