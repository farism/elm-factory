const anyTemplate = require('gulp-any-template')
const filter = require('gulp-filter')
const gulp = require('gulp')
const path = require('path')
const pump = require('pump')
const rename = require('gulp-rename')

const src = glob => path.resolve(__dirname, '../tmpl/boilerplate/', glob)

const initStream = dir => {
  const packageJson = filter(['**/*.json.ejs'], { restore: true })

  return pump(
    gulp.src([src('**/*'), src('**/.*')]),
    packageJson,
    anyTemplate({ name: dir }),
    rename(path => {
      path.extname = ''
    }),
    packageJson.restore,
    gulp.dest(dir)
  )
}

const init = ({ dir }) => {
  gulp.task('init', () => initStream(dir))
}

module.exports = {
  initStream,
  init,
}
