const gulp = require('gulp')

const defaults = require('../../src/defaults').dev

module.exports = {
  command: 'dev [options]',
  desc: 'starts elm-factory in dev mode',
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
      .option('h', {
        alias: 'host',
        describe: 'dev server address',
        default: defaults.host,
      })
      .option('p', {
        alias: 'port',
        describe: 'dev server port',
        default: defaults.port,
      })
      .option('t', {
        alias: 'template',
        describe: 'dev server html template file',
        default: defaults.template,
      })
      .option('r', {
        alias: 'reactor-host',
        describe: 'elm-reactor address',
        default: defaults.reactorHost,
      })
      .option('u', {
        alias: 'reactor-port',
        describe: 'elm-reactor port',
        default: defaults.reactorPort,
      })
  },
  handler: function(argv) {
    require('../tasks/dev')(argv)
    gulp.start('dev')
  },
}
