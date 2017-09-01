const defaults = require('../../src/defaults').dev

module.exports = {
  name: 'dev',
  command: 'dev [options]',
  description: 'starts elm-factory in dev mode',
  options: {
    m: {
      alias: 'main',
      description: 'main entry file',
      default: defaults.main,
    },
    s: {
      alias: 'stylesheets',
      description: 'stylesheets entry file',
      default: defaults.stylesheets,
    },
    t: {
      alias: 'html',
      description: 'html template file',
      default: defaults.html,
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
    x: {
      alias: 'proxy',
      description: 'additional proxies',
      default: defaults.proxy,
    },
    'proxy-rewrite': {
      description: 'rewrite proxy paths',
      default: defaults.proxyRewrite,
    },
  },
}
