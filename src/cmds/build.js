const gulp = require('gulp')

const defaults = require('../../src/defaults').build

module.exports = {
  command: 'build [options]',
  desc: 'builds an elm application for production',
  builder: function(yargs) {
    yargs
      .option('m', {
        alias: 'main',
        describe: 'main entry',
        default: defaults.main,
      })
      .option('s', {
        alias: 'stylesheets',
        describe: 'stylesheets entry',
        default: defaults.stylesheets,
      })
      .option('o', {
        alias: 'output',
        describe: 'output directory',
        default: defaults.output,
      })
      .option('p', {
        alias: 'public',
        describe: 'public path to serve from',
        default: defaults.public,
      })
  },
  handler: function(argv) {
    require('../tasks/build')(argv)
    gulp.start('build')
  },
}
