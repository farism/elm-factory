#!/usr/bin/env node

const chalk = require('chalk')
const gulp = require('gulp')
const program = require('commander')

const { create } = require('../src')

const help = () =>
  console.log(`
  Example:

    ${chalk.bold.cyan('> elm-factory create', chalk.cyan.underline('my-elm-app'))}

    Will:

    - create a boilerplate project
    - cd into the created folder
  `)

program.on('--help', function() {
  help()
})

const name = program.parse(process.argv).args[0]

if (!name) {
  console.log(chalk.red('Please enter a project directory name'))
  help()
  process.exit(1)
}

// load the dev tasks
create({ name })

gulp.start('create')
