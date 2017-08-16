const cssnano = require('cssnano')
const fs = require('fs-extra')
const glob = require('glob-promise')
const path = require('path')
const postcss = require('postcss')
const tmp = require('tmp-promise')
const url = require('postcss-url')
const elmCompiler = require('node-elm-compiler').compileToString
const uglify = require('uglify-js').minify
const xxh = require('xxhashjs')

const {compileCss, colors, defaults, spacer} = require('./core')

const HASH_LEN = 8
const HEX_BASE = 16
const SEED = 0

const assetRegexp = /AssetUrl\('(.*)'\)/g

// HELPERS

const getHash = content =>
  xxh.h32(SEED).update(content).digest().toString(HEX_BASE).substr(0, HASH_LEN)

const getHashedFile = file =>
  fs
    .readFile(file)
    .then(content => {
      const ext = path.extname(file)
      const basename = path.basename(file)
      const nameWithoutExt = path.basename(file, ext)
      const hash = `${nameWithoutExt}.${getHash(content)}${ext}`

      return {file, basename, hash, content}
    })
    .catch(e => console.error(colors.error(e)))

const getHashedFiles = pattern => () =>
  glob(pattern)
    .then(files => Promise.all(files.map(getHashedFile)))
    .catch(e => console.error(colors.error(e)))

const processCss = (assetsUrl, assetsPath) => hashedFile =>
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
    .process(hashedFile.content)
    .then(result => Object.assign({}, hashedFile, {content: result.css}))

const processHashedFiles = (assetsUrl, assetsPath, manifest) => hashedFiles =>
  Promise.all(hashedFiles.map(processCss(assetsUrl, assetsPath))).then(files =>
    manifest.concat(files),
  )

// PIPELINES

const buildMain = (assetsUrl, tmpDir, main) => () =>
  elmCompiler(main, {yes: true})
    .then(data => {
      data
        .match(assetRegexp)
        .map(str => str.replace(assetRegexp, '$1'))
        .catch(e => console.error(colors.error(e)))
    })
    .catch(e => console.error(colors.error(e)))

const buildCss = (assetsUrl, assetsPath, tmpDir, stylesheets, manifest) => () =>
  compileCss(tmpDir, stylesheets)
    .then(getHashedFiles(`${tmpDir}/*.css`))
    .then(processHashedFiles(assetsUrl, assetsPath, manifest))
    .catch(e => console.error(colors.error(e)))

const buildManifest = outputDir => manifest =>
  Promise.all(
    manifest.map(hashedFile =>
      fs.writeFile(`${outputDir}/${hashedFile.hash}`, hashedFile.content),
    ),
  )
    .then(() =>
      manifest.reduce(
        (acc, hashedFile) =>
          Object.assign({}, acc, {[hashedFile.basename]: hashedFile.hash}),
        {},
      ),
    )
    .then(json => {
      fs.writeFile(`${outputDir}/manifest.json`, JSON.stringify(json, null, 2))
    })

const build = ({
  main = defaults.main,
  stylesheets = defaults.stylesheets,
  outputDir = './dist',
  assetsUrl = '/public/',
}) => {
  if (!fs.pathExistsSync(main)) {
    console.error(colors.error(`[Main:notfound] ${main}`))
    return
  }

  if (!fs.pathExistsSync(stylesheets)) {
    console.error(colors.error(`[Stylesheets:notfound] ${stylesheets}`))
    return
  }

  console.info(colors.files(`[Main:use] ${main}`))
  console.info(colors.files(`[Stylesheets:use] ${stylesheets}`))
  spacer()
  console.info(colors.ready(`elm-factory is starting your build!`))
  console.info(colors.ready(`> performing compilation of assets`))
  spacer()

  const manifest = []
  // const {name: tmpDir} = tmp.dirSync({unsafeCleanup: true})
  const tmpDir = '/Users/farismustafa/Documents/Projects/elm-factory/tmp'

  fs
    .emptyDir(outputDir)
    // .then(() => buildMain(assetsUrl, tmpDir, main))
    .then(buildCss(assetsUrl, outputDir, tmpDir, stylesheets, manifest))
    .then(buildManifest(outputDir))
  // .catch(e => console.error(colors.error(e)))
}

module.exports = build
