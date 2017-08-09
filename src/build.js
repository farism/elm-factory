const mkdirp = require('mkdirp')
const path = require('path')

const {compileCss, colors, defaults, spacer, validateFile} = require('./core')

async function build({
  main = defaults.main,
  stylesheets = defaults.stylesheets,
  output = './dist',
}) {
  // get a tmp dir for assets and live reload
  const outputPath = path.join(process.cwd(), output)

  await mkdirp(outputPath)

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

  // do initial asset compilation
  compileCss(outputPath, stylesheets)
}

module.exports = build
