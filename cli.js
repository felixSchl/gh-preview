#!/usr/bin/env node

var server = require('./server')
  , argv = require('minimist')(
        process.argv.slice(2), { alias: {
              'p': 'port'
            , 'h': 'help'
        } }
    )
;

if (!argv._.length || argv.help) {
    return console.log(
        [ "Usage: gh-preview <port>"
        , ""
        , "Starts a `gh-preview` server at <port>"
        , ""
        , "`GET` the rendered output:"
        , "    Visit http://localhost:<port> in your browser"
        , ""
        , "`POST` some markdown to /input:"
        , "    POST /input { title: String, content: String }"
        , ""
        , "Options:"
        , ""
        , "  -h, --help    output usage information"
        ].join('\n')
    );
};

var port = argv._[0]
  , server = server.start(port)
;

console.log(
    [ "Preview now being served at http://localhost:" + port
    , ""
    , "Now `POST` some markdown to /input:"
    , "    Http POST /input { title: String, content: String }"
    ].join('\n')
);
