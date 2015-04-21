var express    = require('express')
  , Rx         = require('rx')
  , _          = require('lodash')
  , path       = require('path')
  , fs         = require('fs')
  , log4js     = require('log4js')
  , Remarkable = require('remarkable')
  , hljs       = require('highlight.js')
;

/**
 * The github preview server.
 *
 * Create and start the preview server at port `port`.
 *
 * To view the currenly rendered output,
 *      visit '/' in the browser.
 *
 * To render markdown and update the output,
 *
 *      Either HTTP-POST some `Input` to '/input',
 *      or create a type-`input` socket connection
 *      and emit `Input` messages.
 *
 *      where:
 *
 *          data Input = Input
 *              { title    :: String       -- The title of document
 *              , markdown :: String       -- The unrendered markdown
 *              , file     :: Maybe String -- The originating file
 *              }
 *
 * To view the currently rendered output,
 *      Either  HTTP-GET '/output' and receive `Output`
 *      or create a type-`output` socket connection
 *      and receive a stream of `Output` messages.
 *
 *      where:
 *
 *          data Output = Output
 *              { title  :: String -- The title of the document
 *              , markup :: String -- The rendered markup
 *              }
 */
var GhPreview = function(port) {

    var self = this;

    self._app         = express();
    self._port        = port;
    self._server      = self._app.listen(self._port);
    self._io          = require('socket.io')(self._server)
    self._output      = new Rx.BehaviorSubject('')
    self._outputters  = []
    self._inputter    = null
    self._inputStream = new Rx.Subject()
    self._logger      = log4js.getLogger('server')

    self._md = new Remarkable({
        highlight: function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(lang, str).value;
                } catch (err) {}
            }
            try {
                return hljs.highlightAuto(str).value;
            } catch (err) {}

            return '';
        }
    });

    self._logger.setLevel('INFO');

    self._app

        .set('views', __dirname)
        .set('view engine', 'jade')
        .use(express.static(__dirname))

        /**
         * Render the output page.
         * The page is responsible for fetching
         * the output itself.
         */
        .get('/', function(req, res) {
            res.render('index.jade')
        })

        /**
         * Return the currently rendered markup.
         */
        .get('/output', function(req, res) {
            res
                .status(200)
                .json(self._output.value)
            ;
        })

        /**
         * Accept incoming input.
         */
        .post('/input', function(req, res) {
            var acc = "";
            req.on('data', function(data) {
                acc += (data.toString('utf-8'));
            });
            req.on('end', function() {
                self._inputStream.onNext(acc);
                res.statusCode = 200;
                res.send('OK');
            });
        });
    ;

    /**
     * Accept incoming socket connections.
     *
     * Based on the query's `type` parameter,
     * either register the connected socket as
     * an 'input' or 'output' socket.
     *
     * If the socket is an 'output' socket,
     *      the socket will receive a steady stream
     *      of `Output`.
     *
     * If the socket is an 'input' socket,
     *      the socket is expected to push a stream
     *      of `Input`.
     */
    self._io.on('connection', function (socket) {
        var add; if (add =
              socket.request._query.type === 'input'  ? self._setInput
            : socket.request._query.type === 'output' ? self._addOutput
            : null
            ) { add.bind(self)(socket); }
        ;
    });

    /**
     * Transform the input stream from incoming
     * `Input` to rendered `Output`.
     */
    self._inputStream

        /*
         * Slow the stream down to a
         * reasonable pace.
         */
        .throttleFirst(10)

        /*
         * De-serialize the incoming data
         * from a json-string to `Input`.
         */
        .flatMapLatest(function(data) {
            self._logger.debug('De-serializing data...');
            try {
                return Rx.Observable.return(JSON.parse(data));
            } catch(e) {
                self._logger.warn('Failed to de-serialize', e);
                return Rx.Observable.empty();
            }
        })

        /*
         * Ensure that `Input` is valid
         * by providing a sane set of defaults.
         */
        .select(function (data) {
            self._logger.debug('Assigning defaults...');
            return _.assign(
                { title:   'README.md'
                , content: '' }
                , data
            );
        })

        /**
         * Resolve `Input.file` if available.
         * FIXME: Remove?
         */
        .select(function(data) {
            self._logger.debug('Resolving file-name...');
            data.title = data.file
                ? path.basename(data.file)
                : data.title
            ;
            return data;
        })

        /**
         * Render the `Input.markdown` and
         * map to `Output`.
         */
        .flatMap(function(data) {
            self._logger.debug('Rendering...');
            return Rx.Observable.return({
                  title: data.title
                , markup: self._md.render(data.markdown)
            });
        })

        /**
         * Upate the current output.
         *
         * Note: This causes automatic propagation
         *       throughout the rest of the system.
         */
        .subscribe(function(data) {
            self._logger.debug('Emitting...');
            self._output.onNext(data);
        })
    ;
}

/**
 * Add a socket receiving the stream of `Output`.
 */
GhPreview.prototype._addOutput = function(socket) {

    var self = this;

    self._logger.info('Adding outputter...', socket.id);

    self._outputters.push(socket);

    self._output.subscribe(function(data) {
        socket.emit('data', data)
    });

    Rx.Observable.fromEvent(socket, 'close')
        .take(1)
        .tap(function() {
            self._logger.info(
                  'Lost outputter'
                , socket.id
            );
        })
        .where(_.partial(_.contains, self._outputters, socket))
        .map(_.partial(_.without, self._outputters, socket))
        .subscribe(function(outputters) {
            self._outputters = outputters;
        })
    ;
};

/**
 * Add a socket emitting a stream of `Input`.
 */
GhPreview.prototype._setInput = function(socket) {

    self._logger.info('Adding inputter...');

    if (self._inputter !== null) {
        self._inputter.close();
    }
    self._inputter = socket;

    socket.on('close', function() {

        self._logger.info('Lost inputter...');

        if (self._inputter === socket) {
            self._inputter = null;
        }
    });

    self._inputter.on('data', function(data) {
        self._inputStream.onNext(data);
    });
};

/**
 * Opaque constructor for `GhPreview`.
 * > See `GhPreview` for docs.
 */
module.exports.start = function (port) {
    return new GhPreview(port);
};
