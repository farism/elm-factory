import chai, { assert, expect } from 'chai'
import chaifs from 'chai-fs'
import path from 'path'
import tmp from 'tmp'

import { init, task } from '../../src/tasks/init'

chai.use(chaifs)

describe('init task', () => {
  it('adds the tasks to gulp', () => {
    const gulp = task({})
    expect(gulp).to.have.a.nested.property('tasks.init')
  })
})

describe.only('init', () => {
  let dir
  let regex
  before(done => {
    dir = tmp.dirSync({ unsafeCleanup: true })
    init(dir.name).on('end', done)
  })

  it('throws an error if a directory is not provided', () => {
    expect(() => init()).to.throw()
  })

  it('creates a directory', () => {
    expect(dir.name).to.be.a.directory()
  })

  it('directory has the correct files', () => {
    expect(dir.name).to.be.a
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
  })

  it('compiles template files with absolute dir slug', () => {
    const slug = dir.name.split('/').pop()

    expect(path.join(dir.name, 'elm-package.json')).to.be.a
      .file()
      .with.contents.that.match(new RegExp(`"summary": "${slug}"`))

    expect(path.join(dir.name, 'package.json')).to.be.a
      .file()
      .with.contents.that.match(new RegExp(`"name": "${slug}"`))
  })
})
