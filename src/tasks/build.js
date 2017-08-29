const cssnano = require('cssnano')
const del = require('del')
const elm = require('gulp-elm')
const elmCss = require('gulp-elm-css')
const elmExtractAssets = require('gulp-elm-extract-assets')
const flatten = require('gulp-flatten')
const gulp = require('gulp')
const gulpif = require('gulp-if')
const path = require('path')
const postcss = require('gulp-postcss')
const postcssUrl = require('postcss-url')
const rev = require('gulp-rev-all')
const runSequence = require('run-sequence')
const uglify = require('gulp-uglify')
const urljoin = require('url-join')
const xxh = require('xxhashjs')
const crypto = require('crypto')

const defaults = require('../defaults').build

const getHash = contents =>
  xxh.h32(0).update(String(contents), 'utf-8').digest().toString(16).substr(0, 8)
// crypto
//   .createHash('sha1')
//   .update(String(contents))
//   .digest('hex')
//   .toString(16)
//   .substr(0, 8)

const getPublicPath = (publicPath, filename) =>
  publicPath.startsWith('http')
    ? urljoin(publicPath, path.basename(filename))
    : path.join(`/${publicPath}/`, path.basename(filename))

const getTransformedFilename = (file, hash) =>
  `${getHash(file.contents)}${path.extname(file.path)}`

const buildCss = (
  stylesheets,
  outputPath,
  publicPath,
  minify = true,
  cwd = process.cwd()
) =>
  gulp
    .src(stylesheets, { base: cwd })
    .pipe(elmCss({ cwd }))
    .pipe(
      postcss([
        postcssUrl({
          url: 'copy',
          basePath: process.cwd(),
          assetsPath: outputPath,
          useHash: true,
          hashOptions: {
            method: getHash,
          },
        }),
        postcssUrl({
          url: asset => getPublicPath(publicPath, asset.url),
        }),
        minify ? cssnano() : contents => contents,
      ])
    )
    .pipe(
      rev.revision({
        fileNameManifest: 'css-manifest.json',
        transformFilename: getTransformedFilename,
      })
    )
    .pipe(gulp.dest(outputPath))
    .pipe(rev.manifestFile())
    .pipe(gulp.dest(outputPath))

const buildMain = (
  main,
  outputPath,
  publicPath,
  minify = true,
  cwd = process.cwd()
) =>
  gulp
    .src(main)
    .pipe(elm({ cwd }))
    .pipe(elmExtractAssets({ cwd, tag: 'AssetUrl' }))
    .pipe(
      rev.revision({
        dontUpdateReference: ['Main.js'],
        fileNameManifest: 'js-manifest.json',
        replacer: (fragment, replaceRegExp, newReference, referencedFile) => {
          const filename = newReference.split('/').pop()
          const newPath = getPublicPath(publicPath, filename)

          fragment.contents = fragment.contents.replace(
            replaceRegExp,
            `$1${newPath}$3$4`
          )
        },
        transformFilename: getTransformedFilename,
      })
    )
    .pipe(flatten())
    .pipe(gulpif(file => minify && path.extname(file.path) === '.js', uglify()))
    .pipe(gulp.dest(outputPath))
    .pipe(rev.manifestFile())
    .pipe(gulp.dest(outputPath))

const task = options => {
  const opts = Object.assign({}, defaults, options)

  /* istanbul ignore next  */
  gulp.task('_clean', () => del(opts.outputPath))

  /* istanbul ignore next  */
  gulp.task('_css', () =>
    buildCss(opts.stylesheets, opts.outputPath, opts.publicPath, opts.cwd)
  )

  /* istanbul ignore next  */
  gulp.task('_main', () =>
    buildMain(opts.main, opts.outputPath, opts.publicPath, opts.cwd)
  )

  /* istanbul ignore next  */
  gulp.task('build', () => runSequence('_clean', '_css', '_main'))

  return gulp
}

module.exports = {
  getHash,
  getPublicPath,
  getTransformedFilename,
  buildCss,
  buildMain,
  task,
}
