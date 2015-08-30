(function() {
  'use strict';

  var basePaths = {
    source:   'source/',
    build: 'build/'
  };

  var paths = {
    html: {
      source: basePaths.source,
      build: basePaths.build
    },
    images: {
      source: basePaths.source + 'images/',
      build: basePaths.build + 'images/'
    },
    scripts: {
      source: basePaths.source + 'scripts/',
      build: basePaths.build + 'scripts/'
    },
    styles: {
      source: basePaths.source + 'styles/',
      build: basePaths.build + 'styles/'
    },
    sprite: {
      source: basePaths.source + 'sprite/*'
    }
  };

  // var spriteConfig = {
  //   imgName: 'sprite.png',
  //   cssName: '_sprite.scss',
  //   imgPath: paths.images.dest + 'sprite.png'
  // };

  var gulp  = require('gulp');
  var es    = require('event-stream');
  var gutil = require('gulp-util');
  var $     = require('gulp-load-plugins')({
    pattern: [
      'gulp-*', 'gulp.*', 'del', 'mkdirp'
    ],
    rename: {
      'gulp-scss-lint':         'sassLint',
      'gulp-scss-lint-stylish': 'sassLintStylish'
    },
    replaceString: /\bgulp[\-.]/
  });
  $.browserSync = require('browser-sync').create();

  var changeEvent = function(event) {
    gutil.log(
      'File',
      gutil.colors.yellow(event.path.replace(__dirname, '')),
      'was',
      gutil.colors.blue(event.type)
    );
  };

  gulp.task('default', ['serve']);

  /**
   * Server task
   */

  gulp.task('serve', ['build'], function() {
    $.browserSync.init({
      server: {
        baseDir: 'build/',
      },
      port: 1337,
      open: true,
      // open: false,
      browser: 'default',
      notify: false
    });

    gulp.watch("source/styles/**/*.scss", ['build:styles'])
      .on('change', changeEvent);
    gulp.watch("source/scripts/**/*.js", ['build:scripts'])
      .on('change', changeEvent);
    gulp.watch("source/**/*.(jpg|png)", ['build:assets'])
      .on('change', changeEvent);
    gulp.watch('source/**/*.html', ['build:html'])
      .on('change', changeEvent);
  });

  /**
   * Watcher tasks
   */

  gulp.task('watch', [
    'watch:scripts', 'watch:styles', 'watch:html', 'watch:assets'
  ]);

  gulp.task('watch:scripts', ['build:scripts'], function(cb) {
    var watcher = gulp.watch(paths.scripts.source + '**/*.js', [
      'build:scripts'
    ]);
    watcher.on('change', changeEvent);
    cb();
  });

  gulp.task('watch:styles', ['build:styles'], function(cb) {
    var watcher = gulp.watch(paths.styles.source + '**/*.scss', [
      'build:styles'
    ]);
    watcher.on('change', changeEvent);
    cb();
  });

  gulp.task('watch:html', ['build:html'], function(cb) {
    var watcher = gulp.watch(paths.html.source + '**/*', [
      'build:html'
    ]);
    watcher.on('change', changeEvent);
    cb();
  });

  gulp.task('watch:images', ['build:images'], function(cb) {
    var watcher = gulp.watch(paths.images.source + '**/*', [
      'build:images'
    ]);
    watcher.on('change', changeEvent);
    cb();
  });

  /**
   * Build tasks
   */

  gulp.task('build', [
    'build:scripts', 'build:styles', 'build:images', 'build:html'
  ]);

  gulp.task('build:scripts', ['clean:scripts', 'lint:scripts'], function(cb) {
    $.mkdirp(paths.scripts.build);
    gulp.src(paths.scripts.source + '**/*.js')
      .pipe($.plumber())
      .pipe($.sourcemaps.init())
      .pipe(gulp.dest(paths.scripts.build))
      .pipe($.uglify({
        preserveComments: 'some' // Should be 'license', but that's dead
      }))
      .pipe($.rename({suffix: '.min'}))
      .pipe($.sourcemaps.write('.'))
      .pipe(gulp.dest(paths.scripts.build))
      .pipe($.browserSync.stream());
    cb();
  });

  gulp.task('build:styles', ['clean:styles', 'lint:styles'], function(cb) {
    $.mkdirp(paths.styles.build);
    gulp.src(paths.styles.source + '**/*.scss')
      .pipe($.plumber())
      .pipe($.sourcemaps.init())
      .pipe($.sass({
        style: 'compressed',
        includePaths: require('node-bourbon').includePaths
      }))
      .pipe($.autoprefixer())
      .pipe(gulp.dest(paths.styles.build))
      .pipe($.minifyCss())
      .pipe($.rename({suffix: '.min'}))
      .pipe($.sourcemaps.write('.'))
      .pipe(gulp.dest(paths.styles.build))
      .pipe($.browserSync.stream());
    cb();
  });

  gulp.task('build:html', ['clean:html'], function(cb) {
    gulp.src(paths.html.source + '**/*.html')
      .pipe($.plumber())
      .pipe(gulp.dest(paths.html.build))
      .pipe($.browserSync.stream());
    cb()
  });

  gulp.task('build:images', ['clean:images'], function() {
    $.mkdirp(paths.images.build);
    gulp.src(paths.images.source + '**/*')
      .pipe($.plumber())
      .pipe(gulp.dest(paths.images.build))
      .pipe($.browserSync.stream());
  });

  /**
   * Lint tasks
   */

  gulp.task('lint:scripts', function(cb) {
    gulp.src([paths.scripts.source + '**/*.js', '!**/external/*.js'])
      .pipe($.plumber())
      .pipe($.jshint())
      .pipe($.jshint.reporter('jshint-stylish'))
    cb();
  });

  gulp.task('lint:styles', function(cb) {
    gulp.src(paths.styles.source + '**/*.scss')
      .pipe($.plumber())
      .pipe($.sassLint({
        config: '.scss-lint.yml',
        customReport: $.sassLintStylish
      }));
    cb();
  });

  /**
   * Cleanup tasks
   */

  gulp.task('clean', function(cb) {
    $.del('build/');
    $.mkdirp('build/');
    cb();
  });

  gulp.task('clean:scripts', function(cb) {
    $.del([
      paths.scripts.build + '**/*.js',
      paths.scripts.build + '**/*.js.map'
    ], cb);
  });

  gulp.task('clean:styles', function(cb) {
    $.del([
      paths.styles.build + '**/*.css',
      paths.styles.build + '**/*.css.map'
    ], cb);
  });

  gulp.task('clean:images', function(cb) {
    $.del([
      paths.images.build + '*'
    ], cb);
  });

  gulp.task('clean:html', function(cb) {
    $.del([
      paths.html.build + '**/*.html'
    ], cb);
  });

})();
