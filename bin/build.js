#!/usr/bin/env node

var program = require('commander')

program
  .version('0.0.1')
  .option('-m --main', 'application main entry', null, './src/Main.elm')
  .option('-c --css', 'application css entry', null, './src/Stylesheet.elm')
  .option('-t --template', 'the html template to use', null, './node_modules/elm-reactor/tmpl/index.hbs')
  .option('-o --output', 'the directory in which to write built files', null, './build')

program.on('--help', function(){
  console.log(`
  Example

    > elm-factory build -m ./src/MyApp.elm -s ./src/MyCss.elm -o ./dist

    Will:

    - build the application using elm-css and elm-make
    - output files to ./dist
  `)
});

program.parse(process.argv)

console.log(program.args)
