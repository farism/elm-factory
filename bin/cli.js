#!/usr/bin/env node

require('yargs')
  .version(function() {
    return require('../package').version
  })
  .help('help')
  .showHelpOnFail(true, 'use --help for available options')
  .commandDir('./cmds')
  .demandCommand().argv
