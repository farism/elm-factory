#!/usr/bin/env node

var program = require('commander')

program
  .version('0.0.1')
  .option('-m, --main-entry', 'app `Main.elm` entry point [default ./src/Main.elm]')
  .option('-s, --stylesheet-entry', 'app `Stylesheet.elm` entry [default ./src/Stylesheet.elm]')
  .option('-o, --output', 'the directory in which to write built files [default .build/]')

program.on('--help', function(){
  console.log(`
  Example

    > elm-factory build -m ./src/MyApp.elm -s ./src/MyCSS.elm -p 3000

    Will:

    - start the elm-factory dev server on http://127.0.0.1:3000
    - use ./src/MyApp.elm as the main entry point
    - use ./src/MyCss.elm as the stylesheet entry point
  `)
});


program.parse(process.argv)

if (program.args.length === 0) {
  program.outputHelp()
  return
}

// console.log(program)
