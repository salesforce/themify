const rename = require("gulp-rename");
const sass = require('postcss-node-sass');
const postcss = require('gulp-postcss');
const gulp = require('gulp');
const {initThemify, themify} = require('./core/themify.ts');
const path = require('path');

const pallete = require(path.join(__dirname, './src/theme/pallete.ts'));

const themifyOptions = {
  createVars: true,
  pallete: pallete,
  screwIE11: false,
  fallback: {
    cssPath: path.join(__dirname, './dist/theme_fallback.css'),
    dynamicPath: path.join(__dirname, './dist/theme_fallback.json')
  }
};

gulp.task('default', () => {

  return gulp.src('./src/index.themes.scss')
    .pipe(postcss([
      initThemify(themifyOptions),
      sass(),
      themify(themifyOptions)
    ]))
    .pipe(rename("bundle.css"))
    .pipe(gulp.dest('dist'));
});