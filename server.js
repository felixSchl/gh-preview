var express = require('express')
  , Rx      = require('rx')
  , marked  = require('marked')
  , _       = require('lodash')
  , path    = require('path')
  , fs      = require('fs')
;

marked.setOptions({
  highlight: function (code) {
    return require('highlight.js').highlightAuto(code).value;
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
        .set('views', '.')
        .set('view engine', 'jade')
        .use(express.static(__dirname))
        .get('/', function (req, res) {
            res.render('index.jade')
        })
        .post('/input', function(req, res) {
            Rx.Observable.fromEvent(req, 'data')
                .take(1)
                .select(function(data) {
                    return data.toString('utf8');
                })
                .subscribe(function(data) {
                    self._inputStream.onNext(data);
                    res.statusCode = 200;
                    res.send('OK');
                })
            ;
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
        .select(function(data) {
            try { return JSON.parse(data); } catch(e) { return null; }
        })
        .select(function (data) {
            return _.assign({ title:  'README.md' , content: '' }, data);
        })
        .select(function (data) {
            data.title   = data.file ? path.basename(data.file) : data.title;
            data.content = marked(data.content);
            return data;
        })
        .subscribe(function (data) {
            _.each(self._outputters, function(outputter) {
                outputter.emit('data', data);
            })
        ;
    });

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

    self._inputStream.onNext(JSON.stringify({
        content:
            fs.readFileSync(
                path.resolve(
                    __dirname, 'README.md'
                )
            ).toString('utf-8')
    }));
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
