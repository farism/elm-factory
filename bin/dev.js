#!/usr/bin/env node

const fs = require('fs')
const program = require('commander')

const dev = require('../src/dev')

program.on('--help', function(){
  console.log(`
  Example:

    > elm-factory dev -m ./src/MyApp.elm -s ./src/MyCss.elm -p 3000 -t ./src/index.html

    Will:

    - start the elm-factory dev server on http://127.0.0.1:3000
    - use ./src/MyApp.elm as the main entry point
    - use ./src/MyCss.elm as the stylesheet entry point
    - use ./src/index.html as the handlebars template file
  `)
})

program
  .option('-m --main [n]', 'application main entry', './src/Main.elm')
  .option('-c --stylesheets [n]', 'application stylesheets entry', './src/Stylesheets.elm')
  .option('-h --host [n]', 'dev server address', '127.0.0.1')
  .option('-p --port [n]', 'dev server port', '8000')
  .option('-t --template [n]', 'dev server html template file', './node_modules/elm-factory/lib/index.hbs')
  .option('-r --reactor-host [n]', 'elm-reactor address', '127.0.0.1')
  .option('-u --reactor-port [n]', 'elm-reactor port', '8001')
  .option('-l --livereload-port [n]', 'livereload connector port', '35729')
  .parse(process.argv)

dev(program.opts())
