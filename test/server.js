import { Server } from '..';
import woody from 'woody';
import _ from 'lodash';
import request from 'request';
import Bluebird from 'Bluebird';
import assert from 'assert';
import eport from 'eport';
import socketIO from 'socket.io-client';

Bluebird.promisifyAll(request);
const eportAsync = Bluebird.promisify(eport);

const isVerbose = _.contains(process.argv, '--verbose');
const logger = woody
  .as(woody.bracketed())
  .to(woody.console)
  .if(() => isVerbose)
  .fork(woody.timestamp())
  .fork(woody.level());

describe('The Github preview server', () => {

  let res, port, server, route;
  beforeEach(Bluebird.coroutine(function*() {
    res = null;
    port = yield eportAsync();
    server = new Server(logger.fork('server'));
    route = slug => `http://localhost:${ port }${ slug }`;
    server.listen(port);
  }));

  afterEach(Bluebird.coroutine(function*() {
    server.stop();
  }));

  it('stores markdown documents', Bluebird.coroutine(function*() {
    // Try get non-existing document `foo.md`, should 404
    [res] = yield request.getAsync(route('/api/doc/foo.md'));
    assert.strictEqual(res.statusCode, 404);

    // Create document `foo.md`
    [res] = yield request.postAsync({
      url: route('/api/doc/foo.md')
    , json: {
        'markdown': '# Foo!'
      }
    });
    assert.strictEqual(res.statusCode, 201);

    // Try get the newly created document `foo.md`, should 200
    [res] = yield request.getAsync(route('/api/doc/foo.md'));
    let body = JSON.parse(res.body);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(body.file, 'foo.md');
    assert.strictEqual(body.markdown, '# Foo!');
  }));

  it('serves over socket.io', Bluebird.coroutine(function*() {
    const socket = socketIO(route('/'), { forceNew: true })
        , deferred = Bluebird.defer();

    // Await the update
    socket.on('document', doc => {
      assert.strictEqual(doc.file, 'foo.md');
      assert.strictEqual(doc.markdown, '# Foo!');
      socket.destroy();
      deferred.resolve({});
    });

    // Create document `foo.md`
    [res] = yield request.postAsync({
      url: route('/api/doc/foo.md')
    , json: {
        'markdown': '# Foo!'
      }
    });

    yield deferred.promise;
  }));
});
