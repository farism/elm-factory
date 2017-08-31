const anyTemplate = require('gulp-any-template')
const filter = require('gulp-filter')
const gulp = require('gulp')
const path = require('path')
const rename = require('gulp-rename')

const init = options => {
  if (!options) {
    throw new Error('must an options object')
  }

  if (!options.dir) {
    throw new Error('must provide a path')
  }

  return new Promise((resolve, reject) => {
    const packageJson = filter(['**/*.json.ejs'], { restore: true })

    gulp
      .src([
        path.resolve(__dirname, '../tmpl/boilerplate/**/*'),
        path.resolve(__dirname, '../tmpl/boilerplate/**/.*'),
      ])
      .pipe(packageJson)
      .pipe(anyTemplate({ name: options.dir.split('/').pop() }))
      .pipe(
        rename(path => {
          path.extname = ''
        })
      )
      .pipe(packageJson.restore)
      .pipe(gulp.dest(options.dir))
      .on('finish', resolve)
      .on('error', reject)
  })
}

module.exports = {
  init,
}
