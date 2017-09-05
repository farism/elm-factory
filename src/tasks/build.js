const anyTemplate = require('gulp-any-template')
const asyncReplace = require('async-replace')
const autoprefixer = require('autoprefixer')
const check = require('check-types')
const cssnano = require('cssnano')
const cssUseref = require('gulp-css-useref')
const debug = require('gulp-debug')
const elm = require('gulp-elm-basic')
const elmCss = require('gulp-elm-css')
const elmCss2 = require('elm-css')
const elmExtractAssets = require('gulp-elm-extract-assets')
const flatten = require('gulp-flatten')
const fs = require('fs-extra')
const gulp = require('gulp')
const gulpif = require('gulp-if')
const path = require('path')
const postcss = require('gulp-postcss')
const postcss2 = require('postcss')
const postcssUrl = require('postcss-url')
const pumpify = require('pumpify')
const rename = require('gulp-rename')
const rev = require('gulp-rev-all')
const rev2 = require('gulp-rev')
const uglify = require('gulp-uglify')
const urljoin = require('url-join')
const xxh = require('xxhashjs')
const tmp = require('tmp')
const tmp2 = require('tmp-promise')

const defaults = require('../defaults').build
const { initializeSpinner, installPackages, validateParam } = require('./utils')

const JS_MANIFEST_FILE = 'js-manifest.json'
const CSS_MANIFEST_FILE = 'css-manifest.json'

// global reference to CLI spinner
const spinner = initializeSpinner()

const getPublicPath = (publicPath, filename) =>
  publicPath.startsWith('http')
    ? urljoin(publicPath, path.basename(filename))
    : path.join('/', publicPath, path.basename(filename))

const getTransformedFilename = (file, hash) =>
  `${getHash(file.contents)}${path.extname(file.path)}`

const getHash = contents =>
  xxh
    .h32(0)
    .update(String(contents), 'utf-8')
    .digest()
    .toString(16)
    .substr(0, 8)

const basenameWithoutExt = file => path.basename(file, path.extname(file))

const filenameWithHash = (contents, file) =>
  `${basenameWithoutExt(file)}.${getHash(contents)}${path.extname(file)}`

const writeAsset = (outDir, file) => {
  validateParam('string', 'outDir', outDir)
  validateParam('string', 'file', file)

  return fs.readFile(file).then(contents => {
    const newFile = filenameWithHash(contents, file)

    return fs
      .outputFile(path.join(outDir, newFile), contents)
      .then(() => newFile)
  })
}

const writeBundle = (
  outDir,
  matcher,
  replacer,
  transformer,
  file,
  cwd = process.cwd()
) => {
  validateParam('string', 'outDir', outDir)
  validateParam('function', 'replacer', replacer)
  validateParam('function', 'transformer', transformer)
  validateParam('string', 'file', file)
  validateParam('string', 'cwd', cwd, false)

  return new Promise((resolve, reject) => {
    return fs.readFile(file).then(contents => {
      asyncReplace(
        contents.toString(),
        matcher,
        (match, url, offset, string, done) =>
          writeAsset(outDir, path.join(cwd, url)).then(hash => {
            done(null, replacer(hash))
          }),
        (err, contents) =>
          err
            ? reject(err)
            : transformer(contents).then(result => {
                const newFile = filenameWithHash(result, file)
                const manifest = { [path.basename(file)]: newFile }

                fs
                  .outputFile(path.join(outDir, newFile), result)
                  .then(() => resolve(manifest))
                  .catch(reject)
              })
      )
    })
  })
}

const writeManifest = (file, manifests) => {
  validateParam('string', 'file', file)
  validateParam('array', 'manifests', manifests)
  check.assert.array.of.object(manifests)

  return new Promise((resolve, reject) => {
    const json = manifests.reduce(
      (acc, manifest) => Object.assign(acc, manifest),
      {}
    )

    fs.outputJson(file, json, { spaces: 2 }).then(() => resolve(json))
  })
}

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
  validateParam('string', 'cwd', cwd, false)

  return new Promise((resolve, reject) => {
    const matcher = /url\((?!http|data)(.*)\)/g
    const replacer = url => `url(${urljoin(publicPath, url)})`
    const transformer = css =>
      new Promise((resolve, reject) => {
        const plugins = [autoprefixer]

        if (minify) {
          plugins.push(cssnano)
        }

        postcss2(plugins)
          .process(css, {})
          .then(result => resolve(result.css))
          .catch(reject)
      })

    tmp2
      .dir({ unsafeCleanup: true })
      .then(dir =>
        // write css files
        elmCss2(cwd, stylesheets, dir.path)
          // read css file names
          .then(() => fs.readdir(dir.path))
          // read css file contents
          .then(files =>
            Promise.all(
              files.map(file =>
                writeBundle(
                  outputPath,
                  matcher,
                  replacer,
                  transformer,
                  path.join(dir.path, file),
                  cwd
                )
              )
            )
          )
          .then(manifests =>
            writeManifest(path.join(outputPath, 'css-manifest.json'), manifests)
          )
          .then(resolve)
      )
      .catch(console.error)
  })
}

const buildMain = (
  main,
  outputPath,
  publicPath,
  assetTag,
  revision = true,
  minify = true,
  cwd = process.cwd()
) => {
  validateParam('string', 'main', main)
  validateParam('string', 'outputPath', outputPath)
  validateParam('string', 'publicPath', publicPath)
  validateParam('string', 'assetTag', assetTag)
  validateParam('boolean', 'revision', revision, false)
  validateParam('boolean', 'minify', minify, false)
  validateParam('string', 'cwd', cwd, false)

  return new Promise((resolve, reject) => {
    pumpify([
      gulp.src(main),
      elm({ cwd }),
      elmExtractAssets({ cwd, tag: assetTag }),
      rev.revision({
        dontUpdateReference: [path.basename(main).replace('.elm', '.js')],
        fileNameManifest: JS_MANIFEST_FILE,
        replacer: (fragment, replaceRegExp, newReference, referencedFile) => {
          const filename = newReference.split('/').pop()
          const newPath = getPublicPath(publicPath, filename)

          fragment.contents = fragment.contents.replace(
            replaceRegExp,
            `$1${newPath}$3$4`
          )
        },
        transformFilename: revision ? getTransformedFilename : name => name,
      }),
      flatten(),
      gulpif(file => minify && path.extname(file.path) === '.js', uglify()),
      gulp.dest(outputPath),
      rev.manifestFile(),
      gulp.dest(outputPath),
    ])
      .on('error', reject)
      .on('finish', resolve)
  })
}

const loadManifest = file => {
  validateParam('string', 'file', file)

  return new Promise((resolve, reject) => {
    fs
      .readFile(file)
      .then(contents => resolve(JSON.parse(contents.toString())))
      .catch(e => console.error(e))
  })
}

const buildHtml = (html, outputPath, publicPath, cwd = process.cwd()) => {
  validateParam('string', 'html', html)
  validateParam('string', 'outputPath', outputPath)
  validateParam('string', 'publicPath', publicPath)
  validateParam('string', 'cwd', cwd, false)

  return new Promise((resolve, reject) => {
    try {
      Promise.all([
        loadManifest(path.join(cwd, outputPath, JS_MANIFEST_FILE)),
        loadManifest(path.join(cwd, outputPath, CSS_MANIFEST_FILE)),
      ]).then(([jsManifest, cssManifest]) => {
        pumpify(
          gulp.src(html),
          anyTemplate({
            title: 'My Application',
            environment: 'production',
            jsManifest,
            cssManifest,
            outputPath,
            publicPath,
          }),
          rename('index.html'),
          gulp.dest(outputPath)
        )
          .on('error', reject)
          .on('finish', resolve)
      })
    } catch (e) {
      console.log(e)
    }
  })
}

const build = options => {
  const opts = Object.assign({}, defaults, options)

  // CLI spinner
  spinner.space()
  spinner.next('old builds are being cleaned')

  return (
    fs
      .emptyDir(opts.outputPath)
      .then(() => {
        spinner.succeed('old builds cleaned')
        spinner.next('elm-package install is starting')

        return installPackages().catch(e => {
          throw 'elm-package install has failed'
        })
      })
      .then(() => {
        spinner.succeed('elm-package install has completed')
        spinner.next('compiling')

        return buildCss(
          opts.stylesheets,
          opts.outputPath,
          opts.publicPath,
          opts.minify,
          opts.cwd
        ).catch(e => {
          throw 'stylesheets failed to compile'
        })
      })
      // .then(() => {
      //   spinner.succeed('elm-package install has completed')
      //   spinner.next('css is now compiling')
      //
      //   return buildCss(
      //     opts.stylesheets,
      //     opts.outputPath,
      //     opts.publicPath,
      //     opts.revision,
      //     opts.minify,
      //     opts.cwd
      //   ).catch(e => {
      //     throw 'stylesheets failed to compile'
      //   })
      // })
      // .then(() => {
      //   spinner.space()
      //   spinner.succeed('css has been compiled')
      //   spinner.next('main application is now compiling')
      //
      //   return buildMain(
      //     opts.main,
      //     opts.outputPath,
      //     opts.publicPath,
      //     opts.assetTag,
      //     true,
      //     opts.cwd
      //   ).catch(e => {
      //     throw 'main application failed to compile'
      //   })
      // })
      // .then(() => {
      //   spinner.space()
      //   spinner.succeed('main application has been compiled')
      //   spinner.next('html is now compiling')
      //
      //   return buildHtml(
      //     opts.html,
      //     opts.outputPath,
      //     opts.publicPath,
      //     opts.cwd
      //   ).catch(e => {
      //     throw 'html failed to compile'
      //   })
      // })
      // .then(() => {
      //   spinner.succeed('html has been compiled')
      // })
      .catch(e => {
        console.log(e)
        spinner.space()
        spinner.fail(e, false)
        throw e
      })
  )
}

module.exports = {
  getHash,
  getPublicPath,
  getTransformedFilename,
  buildCss,
  buildMain,
  build,
}
