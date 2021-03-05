const post = require('../lambda/post');
const validators = require('./testUtils/validators');
const eventGenerator = require('./testUtils/eventGenerator');

describe('post API function integration test', () => {
  test('it should take  body and eturn an API Gateway response', async () => {
    const validTableName = 'shipperAccount';
    process.env.POSTS_TABLE = validTableName;
    const event = eventGenerator({
      body: {
        id: '13',
        firstname: 'we',
        lastname: 'gh',
        phone: '123',
        email: 'gmail',
      },
    });
    const res = await post.postShipper(event);
    expect(res).toBeDefined();
    expect(validators.isApiGetwayResponse(res)).toBe(true);
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body)).toEqual({
      email: 'gmail', firstname: 'we', id: '13', lastname: 'gh', phone: '123',
    });
  });
});
