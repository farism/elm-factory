import { expect } from 'chai'

import { init as defaults } from '../../src/defaults'
import { init } from '../../src/cmds'

describe('$ elm-factory init', () => {
  it('should expose the correct options', () => {
    expect(init.options).to.eql({
      dir: {
        description: 'the project directory',
      },
    })
  })
})
