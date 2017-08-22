const gulp = require('gulp')
const handlebars = require('gulp-compile-handlebars')
const path = require('path')
const pump = require('pump')
const rename = require('gulp-rename')

const init = ({ dir: name }) => {
  const dest = path.join(process.cwd(), name)

  gulp.task('init-src', () => {
    return pump([
      gulp.src(path.join(__dirname, '../tmpl/boilerplate/src/**')),
      gulp.dest(path.join(dest, 'src')),
    ])
  })

  gulp.task('init-elm-package', () => {
    return pump([
      gulp.src(path.join(__dirname, '../tmpl/boilerplate/elm-package.json.hbs')),
      handlebars({ name }),
      rename('elm-package.json'),
      gulp.dest(dest),
    ])
  })

  gulp.task('init-node-package', () => {
    return pump([
      gulp.src(path.join(__dirname, '../tmpl/boilerplate/package.json.hbs')),
      handlebars({ name }),
      rename('package.json'),
      gulp.dest(dest),
    ])
  })

  gulp.task(
    'init',
    ['init-src', 'init-elm-package', 'init-node-package'],
    callback => {
      callback()
    }
  )
}

module.exports = init
