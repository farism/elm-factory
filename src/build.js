const cssnano = require('cssnano')
const fs = require('fs-extra')
const glob = require('glob-promise')
const path = require('path')
const postcss = require('postcss')
const tmp = require('tmp-promise')
const url = require('postcss-url')
const elmCompiler = require('node-elm-compiler').compileToString
const uglify = require('uglify-js').minify

const {
  compileCss,
  colors,
  defaults,
  getHashedFilename,
  loadFilesAsStrings,
  spacer,
  validateFile,
} = require('./core')

function buildMain(tmpDir, main) {
  return elmCompiler(main, {yes: true})
    .then(data =>
      fs.writeFile(path.resolve(tmpDir, 'main.js'), uglify(data).code),
    )
    .catch(e => console.error(colors.error(e)))
}

function buildCss(assetsUrl, assetsPath, tmpDir, stylesheets) {
  return compileCss(tmpDir, stylesheets)
    .then(() => loadFilesAsStrings(`${tmpDir}/*.css`))
    .then(files =>
      Promise.all(
        Object.keys(files).map(key =>
          postcss([
            url({
              url: 'copy',
              basePath: path.resolve('./'),
              assetsPath: path.resolve(assetsPath),
              useHash: true,
            }),
            url({
              url: asset => path.join(assetsUrl, path.basename(asset.url)),
            }),
            cssnano(),
          ])
            .process(files[key])
            .then(result =>
              fs.writeFile(`${tmpDir}/${path.basename(key)}`, result.css),
            ),
        ),
      ),
    )
    .catch(e => console.error(colors.error(e)))
}

function writeBuildManifest(tmpDir, outputDir) {
  return loadFilesAsStrings(`${tmpDir}/*.+(js|css)`)
    .then(files =>
      Promise.all(
        Object.keys(files).map(key =>
          fs.writeFile(
            path.resolve(outputDir, getHashedFilename(key, files[key])),
            files[key],
          ),
        ),
      ),
    )
    .then(() => {})
    .catch(e => console.error(colors.error(e)))
}

function build({
  main = defaults.main,
  stylesheets = defaults.stylesheets,
  outputDir = './dist',
  assetsPath = '/public/',
}) {
  Promise.all([
    validateFile('[Main:notfound]', main),
    validateFile('[Stylesheets:notfound]', stylesheets),
  ])
    .then(() => {
      console.info(colors.files(`[Main:use] ${main}`))
      console.info(colors.files(`[Stylesheets:use] ${stylesheets}`))
      console.info(colors.ready(`elm-factory is starting your build!`))
      console.info(colors.ready(`> performing compilation of assets`))
      spacer()
    })
    .then(() => fs.emptyDir(outputDir))
    .then(() => tmp.dir({unsafeCleanup: true}))
    .then(({path: tmpDir}) =>
      Promise.all([
        Promise.resolve(tmpDir),
        buildMain(tmpDir, main),
        buildCss(assetsPath, outputDir, tmpDir, stylesheets),
      ]),
    )
    .then(([tmpDir]) => writeBuildManifest(tmpDir, outputDir))
    .catch(e => console.error(colors.error(e)))
}

module.exports = build
