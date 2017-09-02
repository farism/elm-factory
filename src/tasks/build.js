const cssnano = require('cssnano')
const del = require('del')
const elm = require('gulp-elm-basic')
const elmCss = require('gulp-elm-css')
const elmExtractAssets = require('gulp-elm-extract-assets')
const flatten = require('gulp-flatten')
const gulp = require('gulp')
const gulpif = require('gulp-if')
const ora = require('ora')
const path = require('path')
const postcss = require('gulp-postcss')
const postcssUrl = require('postcss-url')
const pumpify = require('pumpify')
const rev = require('gulp-rev-all')
const uglify = require('gulp-uglify')
const urljoin = require('url-join')
const xxh = require('xxhashjs')

const defaults = require('../defaults').build
const {
  installPackages,
  spinnerNext,
  spinnerSucceed,
  spinnerFail,
  spacer,
  validateParam,
} = require('./utils')

const getHash = contents =>
  xxh
    .h32(0)
    .update(String(contents), 'utf-8')
    .digest()
    .toString(16)
    .substr(0, 8)

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
) => {
  validateParam('string', 'stylesheets', stylesheets)
  validateParam('string', 'outputPath', outputPath)
  validateParam('string', 'publicPath', publicPath)
  validateParam('boolean', 'minify', minify, false)
  // validateParam('string', 'cwd', cwd, false)

  return new Promise((resolve, reject) => {
    pumpify(
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
      .on('error', reject)
      .on('finish', resolve)
  })
}

const buildMain = (
  main,
  outputPath,
  publicPath,
  minify = true,
  cwd = process.cwd()
) => {
  validateParam('string', 'main', main)
  validateParam('string', 'outputPath', outputPath)
  validateParam('string', 'publicPath', publicPath)
  validateParam('boolean', 'minify', minify, false)
  validateParam('string', 'cwd', cwd, false)

  return new Promise((resolve, reject) => {
    pumpify(
      gulp.src(main),
      elm({ cwd }),
      elmExtractAssets({ cwd, tag: 'AssetUrl' }),
      rev.revision({
        dontUpdateReference: [path.basename(main).replace('.elm', '.js')],
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
      .on('error', reject)
      .on('finish', resolve)
  })
}

const build = options => {
  const opts = Object.assign({}, defaults, options)

  // CLI spinner
  const spinner = ora()

  spinner.text = 'old builds are now being cleaned'
  spinner.start()

  return del(opts.outputPath)
    .then(() => installPackages())
    .then(() => {
      spinner.stopAndPersist({ symbol: spacer(), text: ' ' })
      spinner.succeed('old builds cleaned')
      spinner.stopAndPersist({ symbol: spacer(), text: ' ' })
      spinner.text = 'css is now compiling'
      spinner.start()

      return buildCss(
        opts.stylesheets,
        opts.outputPath,
        opts.publicPath,
        opts.cwd
      )
    })
    .then(() => {
      spinner.stopAndPersist({ symbol: spacer(), text: ' ' })
      spinner.succeed('css has been compiled')
      spinner.stopAndPersist({ symbol: spacer(), text: ' ' })
      spinner.text = 'main application is now compiling'
      spinner.start()

      return buildMain(opts.main, opts.outputPath, opts.publicPath, opts.cwd)
    })
    .then(() => {
      spinner.stopAndPersist({ symbol: spacer(), text: ' ' })
      spinner.succeed('main application has been compiled')
      spinner.stopAndPersist({ symbol: spacer(), text: ' ' })
    })
    .catch(e => spinnerFail(e, spinner))
}

module.exports = {
  getHash,
  getPublicPath,
  getTransformedFilename,
  buildCss,
  buildMain,
  build,
}
