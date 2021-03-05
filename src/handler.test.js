const jestPlugin = require('serverless-jest-plugin');

const mod = require('./handler');

const { lambdaWrapper } = jestPlugin;
const wrapped = lambdaWrapper.wrap(mod, {
  handler: 'hello',
});

describe('hello', () => {
  it('returns parameters in the body', () => wrapped.run({
    queryStringParameters: {
      a: 'b',
    },
  }).then((response) => {
    expect(response.statusCode).toEqual(200);
    expect(JSON.parse(response.body).message).toEqual('Your function executed successfully!');
    expect(JSON.parse(response.body).params).toEqual({
      a: 'b',
    });
  }));
  it('references an environment variable', () => {
    // const originalEnv = process.env.A_VARIABLE;
    process.env.A_VARIABLE = 'Test';
    return wrapped.run({}).then((response) => {
      expect(JSON.parse(response.body).secret).toEqual('Test');
    });
  });
});
