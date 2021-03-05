const AWS = require('aws-sdk');
const get = require('../lambda/get');
const validators = require('./testUtils/validators');
const eventGenerator = require('./testUtils/eventGenerator');

describe('get API function integration test', () => {
  test('it should take  body and eturn an API Gateway response', async () => {
    const oldEnv = process.env;
    const validTableName = 'carrierAccount';
    const data = {
      id: '2',
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
    const event = eventGenerator({
      body: {
        id: '2',
      },
    });
    const res = await get.getCarrierbyId(event);
    expect(res).toBeDefined();
    expect(validators.isApiGetwayResponse(res)).toBe(true);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{
      US_DOT: '1', email: 'gmail', firstname: 'A', id: '2', lastname: 'B', phone: '1', trailer: '12',
    }]);
  });
});
