#!/usr/bin/env node

const program = require('commander')

program.on('--help', function() {
  console.log('')
})

program
  .version('0.0.1')
  .command('dev', 'starts an elm-factory dev server')
  .command('build', 'builds the elm application for production')
  .parse(process.argv)
