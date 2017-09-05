const anyTemplate = require('gulp-any-template')
const asyncReplace = require('async-replace')
const autoprefixer = require('autoprefixer')
const check = require('check-types')
const cssnano = require('cssnano')
const cssUseref = require('gulp-css-useref')
const debug = require('gulp-debug')
const elm = require('gulp-elm-basic')
const elm2 = require('node-elm-compiler')
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
const uglify2 = require('uglify-js')

const defaults = require('../defaults').build
const { initializeSpinner, installPackages, validateParam } = require('./utils')

const LOCAL_ASSET_URL = '(?!http|data)(.*)'
const JS_MANIFEST_FILE = 'js-manifest.json'
const CSS_MANIFEST_FILE = 'css-manifest.json'

// global reference to CLI spinner
const spinner = initializeSpinner()

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
      .catch(console.error)
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
    const matcher = new RegExp(`url\\(${LOCAL_ASSET_URL}\\)`, 'g')
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
        // compile the stylesheet file
        elmCss2(cwd, stylesheets, dir.path)
          // read css file names
          .then(() => fs.readdir(dir.path))
          // write the bundle for each file
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
          // write the manifest
          .then(manifests =>
            writeManifest(path.join(outputPath, CSS_MANIFEST_FILE), manifests)
          )
          // cleanup and resolve with manifest object
          .then(manifest => {
            dir.cleanup()
            resolve(manifest)
          })
      )
      .catch(console.error)
  })
}

const elmCompile = (outDir, file, cwd = process.cwd()) => {
  validateParam('string', 'outDir', outDir)
  validateParam('string', 'file', file)
  validateParam('string', 'cwd', cwd)

  return new Promise((resolve, reject) => {
    const newFile = path.join(
      outDir,
      path.basename(file).replace('.elm', '.js')
    )

    elm2
      .compile(path.join(cwd, file), {
        output: newFile,
        cwd: cwd,
        yes: true,
        processOpts: {
          stdio: 'inherit',
        },
      })
      .on('close', exitCode => {
        if (exitCode === 0) {
          resolve(newFile)
        } else {
          reject('node-elm-compiler Errored with exit code 1')
        }
      })
  })
}

const buildMain = (
  main,
  outputPath,
  publicPath,
  assetTag,
  minify = true,
  cwd = process.cwd()
) => {
  validateParam('string', 'main', main)
  validateParam('string', 'outputPath', outputPath)
  validateParam('string', 'publicPath', publicPath)
  validateParam('string', 'assetTag', assetTag)
  validateParam('boolean', 'minify', minify, false)
  validateParam('string', 'cwd', cwd, false)

  return new Promise((resolve, reject) => {
    const matcher = new RegExp(`${assetTag}\\('${LOCAL_ASSET_URL}'\\)`, 'g')
    const replacer = url => `${assetTag}('${urljoin(publicPath, url)}')`
    const transformer = js =>
      new Promise((resolve, reject) => {
        if (minify) {
          const result = uglify2.minify(js)

          result.error ? reject(result.error) : resolve(result.code)
        } else {
          resolve(js)
        }
      })

    tmp2
      .dir({ unsafeCleanup: true })
      .then(dir =>
        // compile the elm file
        elmCompile(dir.path, main, cwd)
          // write the bundle
          .then(file =>
            writeBundle(outputPath, matcher, replacer, transformer, file, cwd)
          )
          // write the manifest
          .then(manifest =>
            writeManifest(path.join(outputPath, JS_MANIFEST_FILE), [manifest])
          )
          // cleanup and resolve with manifest object
          .then(manifest => {
            dir.cleanup()
            resolve(manifest)
          })
      )
      .catch(console.error)
  })
}

const buildHtml = (
  html,
  outputPath,
  publicPath,
  cssManifest,
  jsManifest,
  cwd = process.cwd()
) => {
  validateParam('string', 'html', html)
  validateParam('string', 'outputPath', outputPath)
  validateParam('string', 'publicPath', publicPath)
  validateParam('object', 'cssManifest', cssManifest)
  validateParam('object', 'jsManifest', jsManifest)
  validateParam('string', 'cwd', cwd, false)

  return new Promise((resolve, reject) => {
    fs.readFile(path.join(cwd, html)).then(contents => {
      const compiler = anyTemplate.compiler({ path: html, contents })

      if (compiler) {
        compiler({
          title: 'My Application',
          environment: 'production',
          jsManifest,
          cssManifest,
          outputPath,
          publicPath,
        })
          .then(result =>
            fs.outputFile(path.join(outputPath, 'index.html'), result)
          )
          .then(resolve)
          .catch(reject)
      } else {
        reject(`*${path.extname(html)} template not supported`)
      }
    })
  })
}

const build = options => {
  const opts = Object.assign({}, defaults, options)

  // CLI spinner
  spinner.space()
  spinner.next('cleaning old builds...')

  return fs
    .emptyDir(opts.outputPath)
    .then(() => {
      spinner.succeed('cleaned old builds')
      spinner.next('installing elm-packages')

      return installPackages().catch(e => {
        throw 'installing elm-package failed'
      })
    })
    .then(() => {
      spinner.succeed('installed elm-packages')
      spinner.next('compiling stylesheets...')

      return buildCss(
        opts.stylesheets,
        opts.outputPath,
        opts.publicPath,
        opts.minify,
        opts.cwd
      ).catch(e => {
        throw 'compiling stylesheets failed'
      })
    })
    .then(cssManifest => {
      spinner.succeed('compiled stylesheets')
      spinner.next('compiling main application...')

      return buildMain(
        opts.main,
        opts.outputPath,
        opts.publicPath,
        opts.assetTag,
        opts.minify,
        opts.cwd
      )
        .then(jsManifest => ({
          cssManifest,
          jsManifest,
        }))
        .catch(e => {
          throw 'compiling main application failed'
        })
    })
    .then(({ cssManifest, jsManifest }) => {
      spinner.space()
      spinner.succeed('compiled main application')
      spinner.next('compiling html templates...')

      return buildHtml(
        opts.html,
        opts.outputPath,
        opts.publicPath,
        cssManifest,
        jsManifest,
        opts.cwd
      ).catch(e => {
        throw 'html failed to compile'
      })
    })
    .then(() => {
      spinner.succeed('compiled html')
    })
    .catch(e => {
      console.log(e)
      spinner.space()
      spinner.fail(e, false)
      throw e
    })
}

module.exports = {
  getHash,
  buildCss,
  buildMain,
  build,
}
