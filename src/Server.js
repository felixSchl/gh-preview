import express from 'express';
import _ from 'lodash';
import path from 'path';
import http from 'http';
import Rx from 'rx';
import woody from 'woody';
import bodyParser from 'body-parser';
import socketIO from 'socket.io';

/**
 * The Github Preview Server
 *
 * Accetps incoming requests to render documents.
 */
export default class Server {

  constructor(logger=woody.noop) {

    this._logger = logger;
    this._server = null;
    this._docs = {};
    this._inputStream = new Rx.Subject();
    this._outputStream = this._inputStream.throttleFirst(10);

    this._app = express()

      .set('views', path.join(__dirname, '..', 'client'))
      .set('view engine', 'jade')
      .use(express.static(path.join(__dirname, '..', 'client')))
      .use(bodyParser.json())

      /**
       * Log all HTTP traffic
       */

      .use((req, _, next) => {
        logger.fork(req.method).debug(req.path);
        next(null);
      })

      /**
       * Render the output page.
       * The page is responsible for fetching
       * the output itself.
       */

      .get('/', (req, res) => {
        res.render('index.jade');
      })

      /**
       * Fetch a given doucment.
       *
       * @param {string} req.params.file
       * The name of the file to retrieve.
       *
       * @returns {Document}
       * The document, or Http404 if not found.
       */
      .get('/api/doc/:file', (req, res) => {
        if (_.has(this._docs, req.params.file)) {
          return res.json(this._docs[req.params.file]);
        } else {
          return res.sendStatus(404);
        }
      })

      /**
       * Fetch a given doucment.
       *
       * @param {String} req.body.file
       * The name of the file to store.
       *
       * @param {String} req.body.markdown
       * The markdown to save for the file.
       *
       * @param {Number} req.body.lines
       * The total number of lines of the document.
       *
       * @param {Number} req.body.cursor
       * The cursor position (line number) of the editor.
       *
       * @returns {Number}
       * Http201 on successful creation.
       */
      .post('/api/doc/', (req, res) => {

        if (_.has(this._docs, req.body.file)) {
          logger.info('Updating document...', req.body.file);
        } else {
          logger.info('Creating document...', req.body.file);
        }

        this._docs[req.body.file] = _.assign(
          this._docs[req.body.file] || {}
        , { file: req.body.file
          , markdown: req.body.markdown
          , lines: req.body.lines
          , cursor: req.body.cursor
          });

        this._inputStream.onNext(
          this._docs[req.body.file]);
        return res.sendStatus(201);
      });

    this._server = http.createServer(this._app);
    this._io = socketIO(this._server);
    this._io.on('connection', this._connect.bind(this));
  }

  /**
   * Connect the given socketIO socket
   *
   * @param {Socket} socket
   * The socket IO socket
   *
   * @returns {undefined}
   */
  _connect(socket) {

    // Create a logger `fxy..a23`
    const logger = this._logger
      .fork('ws')
      .fork([
          _.take(socket.id, 3).join('')
        , '...'
        , _.takeRight(socket.id, 3).join('')
      ].join(''));

    logger.info('Attached!');

    // Pipe our output stream to document
    // updates on the socket.
    const sub = this._outputStream
      .subscribe(socket.emit.bind(socket, 'document'));

    // Dispose of the socket in it's entirety upon
    // disconnect. Leave no traces; Tear down all state.
    socket.on('disconnect', () => {
      logger.warn('Detached!');
      sub.dispose();
    });
  }

  /**
   * Start listening at the given port.
   *
   * @param {Number} port
   * The port to listen on
   *
   * @return {undefined}
   */

  listen(port) {
    this._logger.info(`Listening on port ${ port }...`);
    this._server.listen(port);
  }

  /**
   * Stop the HTTP server.
   *
   * @return {undefined}
   */

  stop() {
    this._logger.warn('Stopping...');
    this._server.close();
  }
}
