const defaults = require('../../src/defaults').build

module.exports = {
  name: 'build',
  command: 'build [options]',
  description: 'builds an elm-factory for production',
  options: {
    m: {
      alias: 'main',
      description: 'main entry',
      default: defaults.main,
    },
    s: {
      alias: 'stylesheets',
      description: 'stylesheets entry',
      default: defaults.stylesheets,
    },
    o: {
      alias: 'output',
      description: 'output directory',
      default: defaults.output,
    },
    p: {
      alias: 'path',
      description: 'absolute path to static assets',
      default: defaults.path,
    },
  },
}
