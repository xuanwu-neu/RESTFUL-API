const { serverlessProcess, serverlessService } = require('./helper.js');

describe.skip('hello', () => {
  beforeAll(async () => {
    // serverlessProcess.start starts serverless offline in a child process
    // unless the test is pointed at a deployed service
    await serverlessProcess.start();
  });

  afterAll(() => {
    // serverlessProcess.stop kills the child process at the end of the test
    // unless the test is pointed at a deployed service
    serverlessProcess.stop();
  });

  it('makes a request to the serverless process', async () => {
    // serverlessService is an axios instance pointed at your serverless offline
    // unless the test is pointed at a deployed service, then it uses that.
    const response = await serverlessService.get('/hello');

    expect(response.data.message).toEqual('Your function executed successfully!');
    expect(response.data.params).toEqual(null);
  });

  it('makes a request that should have a different kind of response', async () => {
    const response = await serverlessService.get('/hello?tomorrow=amazing');

    expect(response.data.params.tomorrow).toEqual('amazing');
  });
});
