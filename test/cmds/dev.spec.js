import { expect } from 'chai'

import { dev as defaults } from '../../src/defaults'
import { dev } from '../../src/cmds'

describe('$ elm-factory dev', () => {
  it('should expose the correct options', () => {
    expect(dev.options).to.eql({
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
        alias: 'template',
        description: 'html template file',
        default: defaults.template,
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
    })
  })
})
