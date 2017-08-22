const defaults = require('../../src/defaults').build

module.exports = {
  command: 'build',
  usage: 'build [options]',
  description: 'builds an elm-factory for production',
  options: {
    m: {
      alias: 'main',
      describe: 'main entry',
      default: defaults.main,
    },
    s: {
      alias: 'stylesheets',
      describe: 'stylesheets entry',
      default: defaults.stylesheets,
    },
    o: {
      alias: 'output',
      describe: 'output directory',
      default: defaults.output,
    },
    p: {
      alias: 'public',
      describe: 'public path to serve from',
      default: defaults.public,
    },
  },
}
