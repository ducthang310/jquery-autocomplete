'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var resource = {
  src: {
    js: [
      "js/app.js"
    ],
    scss: [
      "scss/*.scss"
    ],
  },
  dest: {
    js: "js",
    css: "css"
  }
};

var config = {
  sassOptions: {
    errLogToConsole: false,
    outputStyle: 'expanded'   //// nested, expanded, compact, compressed
  },
  autoprefixerOptions: {
    browsers: ['last 3 versions'],
    cascade: false
  }
};

// Compile Our Sass
gulp.task('sass', function () {
  return gulp.src(resource.src.scss)
    .pipe(sourcemaps.init())
    .pipe(sass(config.sassOptions).on('error', sass.logError))
    .pipe(autoprefixer(config.autoprefixerOptions))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(resource.dest.css))
});

gulp.task('watch', function () {
  gulp.watch('scss/**/*.scss', ['sass']);
});
