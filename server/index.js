import express from 'express';
import _ from 'lodash';
import http from 'http';
import Rx from 'rx';
import woody from 'woody';
import bodyParser from 'body-parser';

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

    this._app = express()
      .use(bodyParser.json())
      .use((req, _, next) => {
        logger.fork(req.method).debug(req.path);
        next(null);
      })
      .get('/doc/:file', (req, res) => {
        if (_.has(this._docs, req.params.file)) {
          return res.json(this._docs[req.params.file]);
        } else {
          return res.sendStatus(404);
        }
      })
      .post('/doc', (req, res) => {
        this._docs[req.body.file] = {
          file: req.body.file
        , markdown: req.body.markdown
        , lines: req.body.lines
        , cursor: req.body.cursor
        };
        return res.sendStatus(201);
      });

    this._io
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
    if (!this._server) {
      this._logger.info(`Listening on port ${ port }...`);
      this._server = http.createServer(this._app);
      this._server.listen(port);
    }
  }


  /**
   * Stop the HTTP server.
   *
   * @return {undefined}
   */

  stop() {
    if (this._server) {
      this._logger.warn('Stopping...');
      this._server.close();
      this._server = null;
    }
  }
}
