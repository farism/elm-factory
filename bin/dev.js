#!/usr/bin/env node

var program = require('commander')

program
  .version('0.0.1')
  .option('-m, --main-entry', 'app `Main.elm` entry point  [default: ./src/Main.elm]')
  .option('-s, --stylesheet-entry', 'app `Stylesheet.elm` entry  [default: ./src/Stylesheet.elm]')
  .option('-h, --host', 'dev server address [default: 127.0.0.1]')
  .option('-p, --port', 'dev server port  [default: 8000]')
  .option('-t, --template', 'dev server html template file')
  .option('-r, --reactor-host', 'elm-reactor address  [default: 127.0.0.1]')
  .option('-u, --reactor-port', 'elm-reactor port  [default: 8001]')
  .option('-l, --livereload-port', 'livereload connector port  [default: 35729]')

program.on('--help', function(){
  console.log(`
  Example:

    > elm-factory dev -m ./src/MyApp.elm -s ./src/MyCSS.elm -p 3000 -t ./src/index.html

    Will:

    - start the elm-factory dev server on http://127.0.0.1:3000
    - use ./src/MyApp.elm as the main entry point
    - use ./src/MyCss.elm as the stylesheet entry point
    - use ./src/index.html as the handlebars template file
  `)
});


program.parse(process.argv)

if (program.args.length === 0) {
  program.outputHelp()
  return
}

// console.log(program)
