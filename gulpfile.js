'use strict';

var gulp = require('gulp')
  , fs = require('fs')
  , source = require('vinyl-source-stream')
  , watchify = require('watchify')
  , sourcemaps = require('gulp-sourcemaps')
  , browserify = require('browserify')
  , buffer = require('vinyl-buffer')
  , gutil = require('gulp-util')
  , babel = require('gulp-babel')
  , livereactload = require('livereactload')
  , babelify = require('babelify');

var isProd = process.env.NODE_ENV === 'production';

var bundler = browserify({
  debug: !isProd
, transform:
    [ babelify.configure({
        extensions: ['.js']
      , ignore: [
          './client/vendor/'
        , './node_modules/'
        ]
      })
    ].concat(isProd ? [] : [ livereactload ])
, entries: [ './client/src/app.js' ]
})

  /**
   * Dependencies
   */

  .require(
    './client/vendor/lodash/lodash.min.js'
  , { expose: '_' })
  .require(
    './client/vendor/rxjs/dist/rx.all.min.js'
  , { expose: 'rxjs' })
  .require(
    './client/vendor/bluebird/js/browser/bluebird.min.js'
  , { expose: 'bluebird' })
  .require(
    './client/vendor/markdown-it/dist/markdown-it.min.js'
  , { expose: 'markdown-it' })
  .require(
    './node_modules/markdown-it-anchor/index.js'
  , { expose: 'markdown-it-anchor' })
  .require(
    './client/vendor/markdown-it-emoji/dist/markdown-it-emoji.min.js'
  , { expose: 'markdown-it-emoj' })
  .require(
    './client/vendor/markdown-it-checkbox/dist/markdown-it-checkbox.min.js'
  , { expose: 'markdown-it-checkbox' })
  .require(
    './client/vendor/highlightjs/highlight.pack.js'
  , { expose: 'highlightjs' })
  .require(
    './client/vendor/socket.io-client/socket.io.js'
  , { expose: 'socket.io' })

gulp.task('make:client', function(){
  bundler
    .bundle()
    .on('error', function(err) {
      gutil.log('Error : ' + err.message);
    })
    .pipe(fs.createWriteStream('./client/app.js'));
});

gulp.task('make:server', function () {
  return gulp.src(['src/**/*.js'])
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});

gulp.task('make', [ 'make:client', 'make:server' ]);

gulp.task('watch:client', [ 'make:client' ], function() {

  livereactload.monitor(
    './client/app.js'
  , { displayNotification: true });

  var watcher = watchify(bundler);

  rebundle();

  return watcher
    .on('error', gutil.log)
    .on('update', rebundle);

  function rebundle() {
    gutil.log('Update JavaScript bundle');
    watcher
      .bundle()
      .on('error', gutil.log)
      .pipe(source('app.js'))
      .pipe(buffer())
      .pipe(gulp.dest('client'));
  }
});

gulp.task('watch:server', [ 'make:server' ], function() {
  return gulp.watch('./src/**/*.js', [ 'make:server' ]);
});

gulp.task('watch', [ 'watch:client', 'watch:server' ]);

gulp.task('default', [ 'make' ]);
