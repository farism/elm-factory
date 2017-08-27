import chai, { assert, expect } from 'chai'
import chaifs from 'chai-fs'
import dirCompare from 'dir-compare'
import path from 'path'
import tmp from 'tmp'

import { init } from '../../src/tasks/init'

chai.use(chaifs)

describe('init', () => {
  it('inits the root files', done => {
    const dir = path.join(__dirname, 'tmp', 'init')

    init(dir).on('end', () => {
      expect(dir).to.be.a
        .directory()
        .with.deep.files([
          '.elmfactoryrc',
          '.gitignore',
          'elm-package.json',
          'index.ejs',
          'package.json',
          'src/Assets.elm',
          'src/Main.elm',
          'src/MainCss.elm',
          'src/Stylesheets.elm',
          'src/assets/css3.png',
        ])
      done()
    })
  })
})
