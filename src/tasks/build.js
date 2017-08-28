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
const pump = require('pump')
const rev = require('gulp-rev-all')
const runSequence = require('run-sequence')
const uglify = require('gulp-uglify')
const urljoin = require('url-join')
const xxh = require('xxhashjs')

const defaults = require('../defaults').build

const getHash = contents =>
  xxh.h32(0).update(String(contents)).digest().toString(16).substr(0, 8)

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
  pump(
    gulp.src(stylesheets, { base: cwd }),
    elmCss({ cwd }),
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
    ]),
    rev.revision({
      fileNameManifest: 'css-manifest.json',
      transformFilename: getTransformedFilename,
    }),
    gulp.dest(outputPath),
    rev.manifestFile(),
    gulp.dest(outputPath)
  )

const buildMain = (
  main,
  outputPath,
  publicPath,
  minify = true,
  cwd = process.cwd()
) =>
  pump(
    gulp.src(main),
    elm({ cwd }),
    elmExtractAssets({ cwd, tag: 'AssetUrl' }),
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
    }),
    flatten(),
    gulpif(file => minify && path.extname(file.path) === '.js', uglify()),
    gulp.dest(outputPath),
    rev.manifestFile(),
    gulp.dest(outputPath)
  )

const task = options => {
  const {
    main = defaults.main,
    stylesheets = defaults.stylesheets,
    outputPath = defaults.outputPath,
    publicPath = defaults.publicPath,
    template = defaults.template,
    cwd = process.cwd(),
  } = options

  gulp.task('_clean', () => del(outputPath))

  gulp.task('_css', () => buildCss(stylesheets, outputPath, publicPath, cwd))

  gulp.task('_main', () => buildMain(main, outputPath, publicPath, cwd))

  gulp.task('build', () => runSequence('_clean', '_css', '_main'))

  return gulp
}

module.exports = {
  buildCss,
  buildMain,
  getHash,
  getPublicPath,
  getTransformedFilename,
  task,
}
