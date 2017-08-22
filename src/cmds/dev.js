const defaults = require('../../src/defaults').dev

module.exports = {
  name: 'dev',
  command: 'dev [options]',
  description: 'starts elm-factory in dev mode',
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
    h: {
      alias: 'host',
      description: 'dev server address',
      default: defaults.host,
    },
    p: {
      alias: 'port',
      description: 'dev server port',
      default: defaults.port,
    },
    t: {
      alias: 'template',
      description: 'dev server html template file',
      default: defaults.template,
    },
    r: {
      alias: 'reactor-host',
      description: 'elm-reactor address',
      default: defaults.reactorHost,
    },
    u: {
      alias: 'reactor-port',
      description: 'elm-reactor port',
      default: defaults.reactorPort,
    },
  },
}
