#!/usr/bin/env node

const program = require('yargs')

  // version number
  .alias('v', 'version')
  .version(function() {
    return require('../package').version
  })

  //help text
  .alias('h', 'help')
  .help('help')
  .showHelpOnFail(true, 'use --help for available options')
  .commandDir('./cmds')
  .demandCommand()
  .argv
