const {findAllDependencies} = require('find-elm-dependencies')
const fs = require('fs-extra')
const gutil = require('gulp-util')
const through = require('through2')
const path = require('path')

const PLUGIN = 'gulp-elm-find-dependencies'

module.exports = function() {
  const transform = function(file, encode, callback) {
    if (file.isNull()) {
      this.push(file)
      return callback()
    }

    if (file.isStream()) {
      this.emit(
        'error',
        new gutil.PluginError(PLUGIN, 'Streams are not supported!'),
      )
      return callback()
    }

    this.push(file)

    findAllDependencies(file.path)
      .then(deps => {
        return Promise.all(
          deps.map(dep => {
            return new Promise((resolve, reject) => {
              fs.readFile(dep).then(contents => {
                this.push(
                  new gutil.File({
                    cwd: process.cwd(),
                    path: dep,
                    contents,
                  }),
                )
                resolve()
              })
            })
          }),
        )
      })
      .then(() => callback())
  }

  return through.obj(transform)
}
