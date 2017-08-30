import { expect } from 'chai'

import { build as defaults } from '../../src/defaults'
import { build } from '../../src/cmds'

describe('$ elm-factory build', () => {
  it('should expose the correct CLI options', () => {
    expect(build.options).to.eql({
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
        description: 'optional html template file',
        default: '',
      },
      o: {
        alias: 'output-path',
        description: 'output directory',
        default: defaults.outputPath,
      },
      p: {
        alias: 'public-path',
        description: 'absolute path for static assets',
        default: defaults.publicPath,
      },
    })
  })
})
