const anyTemplate = require('gulp-any-template')
const filter = require('gulp-filter')
const gulp = require('gulp')
const path = require('path')
const rename = require('gulp-rename')

const init = dir => {
  if (!dir) {
    throw new Error('must provide a path')
  }

  const packageJson = filter(['**/*.json.ejs'], { restore: true })

  return gulp
    .src([
      path.resolve(__dirname, '../tmpl/boilerplate/**/*'),
      path.resolve(__dirname, '../tmpl/boilerplate/**/.*'),
    ])
    .pipe(packageJson)
    .pipe(anyTemplate({ name: dir }))
    .pipe(
      rename(path => {
        path.extname = ''
      })
    )
    .pipe(packageJson.restore)
    .pipe(gulp.dest(dir))
}

const task = ({ dir }) => gulp.task('init', () => init(dir))

module.exports = {
  init,
  task,
}
