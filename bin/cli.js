#!/usr/bin/env node

const program = require('commander')

program.on('--help', function() {
  console.log('')
})

program
  .version('0.0.1')
  .command('create <project-directory>', 'creates an elm-factory boilerplate project')
  .command('dev', 'starts an elm-factory dev server')
  .command('build', 'builds an elm application for production')
  .parse(process.argv)
