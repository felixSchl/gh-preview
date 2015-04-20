var express   = require('express')
  , Rx        = require('rx')
  , marked    = require('marked')
  , _         = require('lodash')
  , path      = require('path')
  , fs        = require('fs')
  , highlight = require('highlight.js').highlight
;

marked.setOptions({
    highlight: function (code, lang, callback) {
        try {
            code = highlight(lang, code).value;
        } catch(e) {}
        callback(null, code);
    }
});

var GhPreview = function(port) {

    var self = this;

    self._app         = express();
    self._port        = port;
    self._server      = self._app.listen(self._port);
    self._io          = require('socket.io')(self._server)
    self._outputters  = []
    self._inputter    = null
    self._inputStream = new Rx.Subject()

    self._app
        .set('views', __dirname)
        .set('view engine', 'jade')
        .use(express.static(__dirname))
        .get('/', function (req, res) {
            res.render('index.jade')
        })
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

    self._io.on('connection', function (socket) {
        var add; if (add =
              socket.request._query.type === 'input'  ? self._setInput
            : socket.request._query.type === 'output' ? self._addOutput
            : null
            ) { add.bind(self)(socket) }
        ;
    });

    self._inputStream
        .distinctUntilChanged()
        .throttleFirst(10)
        .flatMapLatest(function(data) {
            console.log('[server] De-serializing data...');
            try {
                return Rx.Observable.return(JSON.parse(data));
            } catch(e) {
                console.log('[server] Failed to de-serialize', e);
                return Rx.Observable.empty();
            }
        })
        .select(function (data) {
            console.log('[server] Assigning defaults...');
            return _.assign(
                { title:   'README.md'
                , content: '' }
                , data
            );
        })
        .select(function(data) {
            console.log('[server] Resolving file-name...');
            data.title = data.file
                ? path.basename(data.file)
                : data.title
            ;
            return data;
        })
        .flatMap(function (data) {
            console.log('[server] Rendering...');
            return Rx.Observable.fromNodeCallback(
                  marked
                , null
                , function(html) {
                    data.content = html;
                    return data
                  }
            )
            .apply(null, [ data.content ])
            ;
        })
        .subscribe(function (data) {
            console.log('[server] Emitting...');
            _.each(self._outputters, function(outputter) {
                outputter.emit('data', data);
            })
        })
    ;
}

GhPreview.prototype._addOutput = function(socket) {

    var self = this;

    console.log('[server] Adding outputter...');

    self._outputters.push(socket);

    Rx.Observable.fromEvent(socket, 'close')
        .take(1)
        .where(function() {
            return self._outputters.indexOf(socket) > -1;
        })
        .subscribe(function () {
            self._outputters.splice(
                  self._outputters.indexOf(socket)
                , 0
            );
        })
    ;
};

GhPreview.prototype._setInput = function(socket) {

    console.log('[server] Adding inputter...');

    if (self._inputter !== null) {
        self._inputter.close();
    }
    self._inputter = socket;

    socket.on('close', function() {

        console.log('[server] Lost inputter...');

        if (self._inputter === socket) {
            self._inputter = null;
        }
    });

    self._inputter.on('data', function(data) {
        self._inputStream.onNext(data);
    });
};

module.exports.start = function (port) {
    return new GhPreview(port);
};
