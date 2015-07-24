'use strict';

var gulp = require('gulp')
  , fs = require('fs')
  , browserify = require('browserify')
  , babelify = require('babelify');

gulp.task('default', function(){
  return browserify({ debug: true })
    .transform(babelify.configure({ extensions: ['.es6'] }))
    .require('./client/vendor/react/react.js', { expose: 'react' })
    .require('./client/vendor/rxjs/dist/rx.all.js', { expose: 'rxjs' })
    .require('./client/vendor/bluebird/js/browser/bluebird.js', { expose: 'bluebird' })
    .require('./client/vendor/remarkable/dist/remarkable.min.js', { expose: 'remarkable' })
    .require('./client/vendor/highlightjs/highlight.pack.js', { expose: 'highlightjs' })
    .require('./client/vendor/socket.io-client/socket.io.js', { expose: 'socket.io' })
    .require('./client/src/app.es6', { entry: true })
    .bundle()
    .on('error', function (err) { console.log('Error : ' + err.message); })
    .pipe(fs.createWriteStream('./client/app.js'));
});
