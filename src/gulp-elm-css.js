const elmCss = require('elm-css')
const fs = require('fs-extra')
const glob = require('glob-promise')
const gutil = require('gulp-util')
const through = require('through2')
const tmp = require('tmp-promise')
const path = require('path')

const PLUGIN = 'gulp-elm-css'

const defaults = {
  cwd: process.cwd(),
  module: 'Stylesheets',
  out: null,
  port: 'files',
}

module.exports = function(options) {
  const transform = function(file, encode, callback) {
    if (file.isStream()) {
      this.emit(
        'error',
        new gutil.PluginError(PLUGIN, 'Streams are not supported!'),
      )
      return callback()
    }

    const {cwd, module, out, port} = Object.assign({}, defaults, options)
    const tmpDir = tmp.dirSync({unsafeCleanup: true})
    const dir = out || tmpDir.name

    elmCss(cwd, file.path, dir, module, port)
      .then(() => glob(`${dir}/*.css`))
      .then(files =>
        Promise.all(files.map(file => fs.readFile(file))).then(allContent => {
          allContent.map((contents, i) => {
            this.push(
              new gutil.File({
                cwd: process.cwd(),
                path: path.basename(files[i]),
                contents,
              }),
            )
          })
        }),
      )
      .then(() => {
        dir.removeCallback && dir.removeCallback()
        callback()
      })
      .catch(e => {
        // console.error(e)
        dir.removeCallback && dir.removeCallback()
        callback()
      })
  }

  return through.obj(transform)
}
