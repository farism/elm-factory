const fs = require('fs-extra')
const glob = require('glob-promise')
const gutil = require('gulp-util')
const through = require('through2')
const path = require('path')
const xxh = require('xxhashjs')

const PLUGIN = 'gulp-elm-extract-assets'
const HASH_LEN = 8
const HEX_BASE = 16
const SEED = 0

const getHash = str =>
  xxh.h32(SEED).update(str).digest().toString(HEX_BASE).substr(0, HASH_LEN)

const defaults = {
  tag: 'AssetUrl',
}

module.exports = function(options) {
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

    const {tag} = Object.assign({}, defaults, options)

    const regexp = new RegExp(`${tag}\\('(.*)'\\)`, 'g')

    const assets = []
    String(file.contents).replace(regexp, (match, asset) => {
      assets.push(asset)
    })

    this.push(file)

    Promise.all(
      assets.map(asset =>
        fs.readFile(path.join(process.cwd(), asset)).then(contents => {
          this.push(
            new gutil.File({
              cwd: file.cwd,
              path: path.join(process.cwd(), asset),
              contents,
            }),
          )
        }),
      ),
    ).then(() => callback())
  }

  return through.obj(transform)
}
