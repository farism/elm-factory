import chai, { assert, expect } from 'chai'
import chaifs from 'chai-fs'
import path from 'path'
import tmp from 'tmp'

import { init, task } from '../../src/tasks/init'

chai.use(chaifs)

describe('INIT TASK', () => {
  let dir
  let promise

  before(done => {
    dir = tmp.dirSync({ unsafeCleanup: true })
    promise = init({ dir: dir.name }).then(done)
  })

  after(() => {
    dir.removeCallback()
  })

  it('throws an error if options are not provided', () => {
    expect(() => init()).to.throw()
  })

  it('throws an error if a directory is not provided', () => {
    expect(() => init({})).to.throw()
  })

  it('creates a directory', () => {
    expect(dir.name).to.be.a.directory()
  })

  it('directory has the correct files', () => {
    expect(dir.name)
      .to.be.a.directory()
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

    expect(path.join(dir.name, 'elm-package.json'))
      .to.be.a.file()
      .with.contents.that.match(new RegExp(`"summary": "${slug}"`))

    expect(path.join(dir.name, 'package.json'))
      .to.be.a.file()
      .with.contents.that.match(new RegExp(`"name": "${slug}"`))
  })

  describe('init', () => {
    it('returns a promise', () => {
      expect(promise).to.be.a('promise')
    })

    it('should resolve', function() {
      this.timeout(60000)

      return expect(promise).to.eventually.be.fulfilled
    })
  })
})
