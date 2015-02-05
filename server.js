var express = require('express')
  , Rx      = require('rx')
  , marked  = require('marked')
  , _       = require('lodash')
  , app     = express()
  , port    = 1234
  , server  = app.listen(port)
  , io      = require('socket.io')(server)
;

app
    .set('views', '.')
    .use(express.static(__dirname))
    .engine('html', require('ejs').renderFile)
    .get('/', function (req, res) {
        res.render('index.html')
    })
;


var _output = []
  , _addOutput = function(socket) {
      console.log('[server] Adding outputter...');
      _output.push(socket);
    }
;

var _input = null
  , _inputStream = new Rx.Subject()
  , _setInput = function(socket) {
        if (_input !== null) {
            _input.close();
        }
        _input = socket;

        socket.on('close', function() {
            console.log('[server] Lost inputter...');
            if (_input === socket) {
                _input = null;
            }
        });

        _input.on('data', function(data) {
            console.log('[server] Adding inputter...');
            _inputStream.onNext(data);
        });
    }
;

_inputStream.subscribe(function (input) {
    _.each(_output, function(output) {
        output.emit('data', marked(input));
    });
});

io.on('connection', function (socket) {

    var add; if (add =
          socket.request._query.type === 'input'  ? _setInput
        : socket.request._query.type === 'output' ? _addOutput
        : null
        ) { add.bind(null)(socket) }
    ;

});
