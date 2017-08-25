const anyTemplate = require('gulp-any-template')
const gulp = require('gulp')
const path = require('path')
const pump = require('pump')
const rename = require('gulp-rename')

const init = ({ dir: name }) => {
  const dest = path.join(process.cwd(), name)

  gulp.task('init-root', () => {
    return pump([
      gulp.src([
        path.join(__dirname, '../tmpl/boilerplate/.gitignore'),
        path.join(__dirname, '../tmpl/boilerplate/.elmfactoryrc'),
        path.join(__dirname, '../tmpl/boilerplate/index.ejs'),
      ]),
      gulp.dest(path.join(dest)),
    ])
  })

  gulp.task('init-src', () => {
    return pump([
      gulp.src([path.join(__dirname, '../tmpl/boilerplate/src/**/**')]),
      gulp.dest(path.join(dest, 'src')),
    ])
  })

  gulp.task('init-elm-package', () => {
    return pump([
      gulp.src(
        path.join(__dirname, '../tmpl/boilerplate/elm-package.json.ejs')
      ),
      anyTemplate({ name }),
      rename('elm-package.json'),
      gulp.dest(dest),
    ])
  })

  gulp.task('init-node-package', () => {
    return pump([
      gulp.src(path.join(__dirname, '../tmpl/boilerplate/package.json.ejs')),
      anyTemplate({ name }),
      rename('package.json'),
      gulp.dest(dest),
    ])
  })

  gulp.task(
    'init',
    ['init-root', 'init-src', 'init-elm-package', 'init-node-package'],
    callback => {
      callback()
    }
  )
}

module.exports = init
