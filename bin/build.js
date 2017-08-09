#!/usr/bin/env node

const program = require('commander')

const build = require('../src/build')

program.on('--help', function() {
  console.log(`
  Example:

    > elm-factory build -m ./src/MyApp.elm -s ./src/MyCss.elm -o ./dist

    Will:

    - build the application using elm-css and elm-make
    - output files to ./dist
    `)
})

program
  .option('-m --main [n]', 'application main entry')
  .option('-c --stylesheets [n]', 'application stylesheets entry')
  .option('-o --output [n]', 'the directory in which to write built files')
  .parse(process.argv)

build(program.opts())
