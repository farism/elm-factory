#!/usr/bin/env node

const init = require('../src/index');

var program = require('commander');

program
  .version('0.0.1')

program
  .command('build')
  .description('build an elm app')
  .option("-e, --entry [path]", "Which setup mode to use")
  .action(function (options) {
    console.log(options.entry)
  });

program.on('--help', function() {
  console.log('  Examples:');
  console.log('');
  console.log('    $ custom-help --help');
  console.log('    $ custom-help -h');
  console.log('');
});

program.parse(process.argv);

// console.log(program)
