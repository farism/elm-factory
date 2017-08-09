#!/usr/bin/env node

var program = require('commander')

program
  .version('0.0.1')
  .command('dev', 'starts an elm-factory dev server')
  .command('build', 'builds the elm application for production')

program.parse(process.argv)
