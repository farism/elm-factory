async function dev(main, stylesheet, ) {
  // get a tmp dir for assets and live reload
  const {path: dir} = await tmp.dir()

  // proceses
  try {
    await validateEntry('Main', main)
    await validateEntry('Stylesheet', stylesheet)
  }

  console.info(colors.files(`[Main:entry:use] ${main}`))
  console.info(colors.files(`[Stylesheet:entry:use] ${stylesheet}`))

  console.info(
    chalk.bold.yellow(
      `elm-factory is starting your build!`,
    ),
  )
  console.info(chalk.bold.yellow(`> performing compilation of assets`))
  spacer()

  // do initial asset compilation
  compileCss(outputDir = path.join(process.cwd(), './dist'), stylesheet)
}
