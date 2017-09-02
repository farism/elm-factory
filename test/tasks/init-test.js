import chai, { assert, expect } from 'chai'
import chaifs from 'chai-fs'
import path from 'path'
import tmp from 'tmp'

import { init } from '../../src/tasks/init'

chai.use(chaifs)

describe.only('INIT TASK', () => {
  let dir
  let promise

  beforeEach(done => {
    dir = tmp.dirSync({ unsafeCleanup: true })
    promise = init({ dir: dir.name }).then(done)
  })

  afterEach(() => {
    dir.removeCallback()
  })

  describe('params', () => {
    it('throws if object is invalid', () => {
      expect(() => init(' ')).to.throw('parameter `options` expected `object`')
      expect(() => init({ dir: 1 })).to.throw(
        'parameter `options.dir` expected `string`'
      )
    })
  })

  it('returns a promise', () => {
    expect(promise).to.be.a('promise')
  })

  it('should resolve', function() {
    this.timeout(60000)

    return expect(promise).to.eventually.be.fulfilled
  })

  it('rejects with non empty directory', () => {
    return expect(init({ dir })).to.eventually.be.rejected
  })

  it('creates a directory', () => {
    expect(dir.name).to.be.a.directory()
  })

  it('directory has the correct files', () => {
    expect(dir.name)
      .to.be.a.directory()
      .with.deep.files([
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
})
