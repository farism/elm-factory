import chai, { assert, expect } from 'chai'
import chaifs from 'chai-fs'
import path from 'path'

import { init, task } from '../../src/tasks/init'

chai.use(chaifs)

const dir = path.join(__dirname, 'tmp', 'init')

describe('init task', () => {
  it('adds the tasks to gulp', () => {
    const gulp = task({})
    expect(gulp).to.have.a.nested.property('tasks.init')
  })
})

describe('init', () => {
  it('throws an error if a directory is not provided', () => {
    expect(() => init()).to.throw()
  })

  it('inits a project', done => {
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
