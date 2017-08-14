const fs = require('fs-extra')
const mkdirp = require('mkdirp-promise')
const path = require('path')
const postcss = require('postcss')
const tmp = require('tmp-promise')
const url = require('postcss-url')

const {compileCss, colors, defaults, spacer, validateFile} = require('./core')

const compileCssToString = (outputPath, stylesheets) =>
  compileCss(outputPath, stylesheets)

async function build({
  main = defaults.main,
  stylesheets = defaults.stylesheets,
  output = './dist',
}) {
  // get a tmp dir for assets and live reload
  const {path: dir, cleanup} = await tmp.dir()

  // proceses
  try {
    await validateFile('[Main:notfound]', main)
    await validateFile('[Stylesheets:notfound]', stylesheets)
  } catch (e) {}

  console.info(colors.files(`[Main:use] ${main}`))
  console.info(colors.files(`[Stylesheets:use] ${stylesheets}`))
  console.info(colors.ready(`elm-factory is starting your build!`))
  console.info(colors.ready(`> performing compilation of assets`))
  spacer()

  mkdirp(output)
    .then(() => compileCss(dir, stylesheets))
    .then(() => fs.readFile(path.join(dir, 'index.css')))
    .then(css =>
      postcss()
        .use(
          url({
            url: 'copy',
            useHash: true,
            assetsPath: path.join(process.cwd(), output)
          }),
        )
        .process(css.toString(), {
          from: path.join(dir, 'index.css'),
          to: path.join(process.cwd(), output, 'index.css'),
        }),
    )
    .then(result => fs.writeFile(path.join(output, 'index.css'), result.css))

  // console.log(stylesheet.toString())
}

module.exports = build
