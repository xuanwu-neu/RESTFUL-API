const post = require('../lambda/post');
const validators = require('./testUtils/validators');
const eventGenerator = require('./testUtils/eventGenerator');

describe('post API function integration test', () => {
  test('it should take  body and eturn an API Gateway response', async () => {
    const validTableName = 'carrierAccount';
    process.env.POSTS_TABLE = validTableName;
    const event = eventGenerator({
      body: {
        id: '3',
        firstname: 'we',
        lastname: 'gh',
        phone: '123',
        email: 'gmail',
        US_DOT: '12',
        trailer: '122',
      },
    });
    const res = await post.postCarrier(event);
    expect(res).toBeDefined();
    expect(validators.isApiGetwayResponse(res)).toBe(true);
    expect(JSON.parse(res.body)).toEqual({
      US_DOT: '12',
      email: 'gmail',
      firstname: 'we',
      id: '3',
      lastname: 'gh',
      phone: '123',
      trailer: '122',
    });
  });
});
