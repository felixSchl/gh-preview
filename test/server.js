import Server from '..';
import woody from 'woody';
import _ from 'lodash';
import request from 'request';
import Bluebird from 'Bluebird';
import assert from 'assert';
import eport from 'eport';

Bluebird.promisifyAll(request);
const eportAsync = Bluebird.promisify(eport);

const isVerbose = _.contains(process.argv, '--verbose');
const logger = woody
  .as(woody.bracketed())
  .to(woody.console)
  .if(() => isVerbose)
  .fork(woody.timestamp())
  .fork(woody.level())
  .fork('tests');

describe('The Github preview server', () => {
  it('stores markdown documents', Bluebird.coroutine(function*() {
    const port = yield eportAsync()
        , server = new Server(logger.fork('server'))
        , route = slug => `http://localhost:${ port }${ slug }`;

    var res;

    /*
     * Start the server
     */

    server.listen(port);

    /*
     * Try get non-existing document `foo.md`, should 404
     */

    [res] = yield request.getAsync(route('/doc/foo.md'));
    assert.strictEqual(res.statusCode, 404);

    /*
     * Create document `foo.md`
     */

    [res] = yield request.postAsync({
      url: route('/doc')
    , json: {
        'file': 'foo.md'
      , 'markdown': '# Foo!'
      }
    });
    assert.strictEqual(res.statusCode, 201);

    /*
     * Try get non-existing document `foo.md`, should 404
     */

    [res] = yield request.getAsync(route('/doc/foo.md'));
    let body = JSON.parse(res.body);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(body.file, 'foo.md');
    assert.strictEqual(body.markdown, '# Foo!');
  }));
});
