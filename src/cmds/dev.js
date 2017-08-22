const defaults = require('../../src/defaults').dev

module.exports = {
  command: 'dev',
  usage: 'dev [options]',
  description: 'starts elm-factory in dev mode',
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
    h: {
      alias: 'host',
      describe: 'dev server address',
      default: defaults.host,
    },
    p: {
      alias: 'port',
      describe: 'dev server port',
      default: defaults.port,
    },
    t: {
      alias: 'template',
      describe: 'dev server html template file',
      default: defaults.template,
    },
    r: {
      alias: 'reactor-host',
      describe: 'elm-reactor address',
      default: defaults.reactorHost,
    },
    u: {
      alias: 'reactor-port',
      describe: 'elm-reactor port',
      default: defaults.reactorPort,
    },
  },
}
