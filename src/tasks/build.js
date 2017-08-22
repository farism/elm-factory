const cssnano = require('cssnano')
const del = require('del')
const elm = require('gulp-elm')
const flatten = require('gulp-flatten')
const gulp = require('gulp')
const path = require('path')
const postcss = require('gulp-postcss')
const pump = require('pump')
const rev = require('gulp-rev-all')
const runSequence = require('run-sequence')
const url = require('postcss-url')
const xxh = require('xxhashjs')
const elmExtractAssets = require('gulp-elm-extract-assets')
const elmCss = require('gulp-elm-css')

const defaults = require('../defaults').build

const build = ({
  main = defaults.main,
  stylesheets = defaults.stylesheets,
  output = defaults.output,
  path: publicPath = 'public',
}) => {
  const getHash = contents =>
    xxh.h32(0).update(String(contents)).digest().toString(16).substr(0, 8)

  const transformFilename = (file, hash) =>
    `${getHash(file.contents)}${path.extname(file.path)}`

  gulp.task('build-clean', () => {
    del(output)
  })

  gulp.task('build-main', () => {
    pump([
      gulp.src(main),
      elm(),
      elmExtractAssets({ tag: 'AssetUrl' }),
      rev.revision({
        fileNameManifest: 'js-manifest.json',
        dontUpdateReference: ['Main.js'],
        replacer: (fragment, replaceRegExp, newReference, referencedFile) => {
          const filename = newReference.split('/').pop()
          const newPath = path.join(path, filename)

          fragment.contents = fragment.contents.replace(
            replaceRegExp,
            `$1${newPath}$3$4`
          )
        },
        transformFilename,
      }),
      flatten(),
      gulp.dest(output),
      rev.manifestFile(),
      gulp.dest(output),
    ])
  })

  gulp.task('build-css', () =>
    pump([
      gulp.src(stylesheets),
      elmCss(),
      postcss([
        url({
          url: 'copy',
          basePath: path.resolve('./'),
          assetsPath: path.resolve(output),
          useHash: true,
          hashOptions: {
            method: getHash,
          },
        }),
        url({
          url: asset => path.join(path, path.basename(asset.url)),
        }),
        cssnano(),
      ]),
      rev.revision({
        fileNameManifest: 'css-manifest.json',
        transformFilename,
      }),
      gulp.dest(output),
      rev.manifestFile(),
      gulp.dest(output),
    ])
  )

  gulp.task('build', ['build-clean', 'build-main', 'build-css'])
}

module.exports = build
