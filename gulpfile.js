'use strict';

var gulp = require('gulp')
  , fs = require('fs')
  , sourcemaps = require('gulp-sourcemaps')
  , browserify = require('browserify')
  , babel = require('gulp-babel')
  , babelify = require('babelify');

gulp.task('make:client', function(){
  return browserify({ debug: true })

    /**
     * Transforms
     */

    .transform(babelify.configure({
      extensions: ['.js']
    , ignore: ['./client/vendor/']
    }))

    /**
     * Dependencies
     */

    .require(
      './client/vendor/react/react.js'
    , { expose: 'react' })
    .require(
      './client/vendor/rxjs/dist/rx.all.js'
    , { expose: 'rxjs' })
    .require(
      './client/vendor/bluebird/js/browser/bluebird.js'
    , { expose: 'bluebird' })
    .require(
      './client/vendor/markdown-it/dist/markdown-it.min.js'
    , { expose: 'markdown-it' })
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

    /**
     * Entry point
     */

    .require('./client/src/app.js', { entry: true })

    .bundle()
    .on('error', function(err) {
      console.log('Error : ' + err.message);
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
  return gulp.watch('./client/src/**/*.js', [ 'make:client' ]);
});

gulp.task('watch:server', [ 'make:server' ], function() {
  return gulp.watch('./src/**/*.js', [ 'make:server' ]);
});

gulp.task('watch', [ 'watch:client', 'watch:server' ]);

gulp.task('default', [ 'make' ]);
