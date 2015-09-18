import { Server } from '..';
import woody from 'woody';
import _ from 'lodash';
import request from 'request';
import Bluebird from 'bluebird';
import assert from 'assert';
import eport from 'eport';
import { expect } from 'chai';
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
    this.timeout(4000);
    res = null;
    port = yield eportAsync();
    server = new Server(logger.fork('server'));
    route = slug => `http://localhost:${ port }${ slug }`;
    server.listen(port);
  }));

  afterEach(Bluebird.coroutine(function*() {
    server.stop();
  }));

  it('serves over socket.io', Bluebird.coroutine(function*() {
    const socket = socketIO(route('/'), { forceNew: true })
        , deferred = Bluebird.defer();

    // Await the update
    var i = 0;
    socket.on('document', doc => {
      expect(doc.title).to.be.a('string');
      expect(doc.markdown).to.be.a('string');
      expect(doc.file).to.be.a('string');
      switch(i) {
        case 0:
          // This is the sample document.
          // It is always emitted as the first document.
          expect(doc.title).to.equal('Welcome');
          i = i + 1;
          break;
        case 1:
          expect(doc.file).to.equal('/bar/foo.md');
          expect(doc.title).to.equal('foo.md');
          expect(doc.markdown).to.equal('# Foo!');
          i = i + 1;
          break;
        case 2:
          expect(doc.file).to.equal('foo.md');
          expect(doc.title).to.equal('foo.md');
          expect(doc.markdown).to.equal('# Bar!');
          socket.destroy();
          i = i + 1;
          deferred.resolve({});
          break;
      }
    });

    // Create document `foo.md`
    [res] = yield request.postAsync({
      url: route('/api/doc')
    , json: {
        'file': '/bar/foo.md'
      , 'markdown': '# Foo!'
      }
    });

    // Create document `foo.md`
    [res] = yield request.postAsync({
      url: route('/api/doc')
    , json: {
        'file': 'foo.md'
      , 'markdown': '# Bar!'
      }
    });

    yield deferred.promise;
  }));
});
