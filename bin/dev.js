#!/usr/bin/env node

const gulp = require('gulp')
const portscanner = require('portscanner')
const program = require('commander')

const {dev} = require('../gulpfile')

program.on('--help', function() {
  console.log(`
  Example:

    > elm-factory dev -m ./src/MyApp.elm -s ./src/MyCss.elm -p 3000 -t ./src/index.hbs

    Will:

    - start the elm-factory dev server on http://127.0.0.1:3000
    - use ./src/MyApp.elm as the main entry point
    - use ./src/MyCss.elm as the stylesheet entry point
    - use ./src/index.hbs as the handlebars template file
  `)
})

program
  .option('-m --main [n]', 'application main entry')
  .option('-c --stylesheets [n]', 'application stylesheets entry')
  .option('-h --host [n]', 'dev server address')
  .option('-p --port [n]', 'dev server port')
  .option('-t --template [n]', 'dev server html template file')
  .option('-r --reactor-host [n]', 'elm-reactor address')
  .option('-u --reactor-port [n]', 'elm-reactor port')
  .parse(process.argv)

// load the dev tasks

const opts = program.opts()

opts.host || opts.port
  ? dev(opts) && gulp.start('dev')
  : portscanner.findAPortNotInUse(8000, 9000).then(port => {
      portscanner.findAPortNotInUse(8010, 9000).then(reactorPort => {
        dev(Object.assign({}, opts, {port, reactorPort}))
        gulp.start('dev')
      })
    })
