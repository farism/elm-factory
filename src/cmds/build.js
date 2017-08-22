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
      alias: 'output-path',
      description: 'output directory path',
      default: defaults.outputPath,
    },
    p: {
      alias: 'public-path',
      description: 'absolute path to static assets',
      default: defaults.publicPath,
    },
  },
}
