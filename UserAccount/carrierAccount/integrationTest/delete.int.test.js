const AWS = require('aws-sdk');
const del = require('../lambda/delete');
const validators = require('./testUtils/validators');
const eventGenerator = require('./testUtils/eventGenerator');

describe('delete API function integration test', () => {
  test('it should take  body and eturn an API Gateway response', async () => {
    const oldEnv = process.env;
    const validTableName = 'carrierAccount';
    const data = {
      id: '1',
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
        id: '1',
      },
    });
    const res = await del.deleteCarrierbyId(event);
    expect(res).toBeDefined();
    expect(validators.isApiGetwayResponse(res)).toBe(true);
    expect(res.statusCode).toBe(204);
    expect(res.body).toEqual('Successfully Deleted');
  });
});
