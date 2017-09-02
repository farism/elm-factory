import chai, { assert, expect } from 'chai'
import chaifs from 'chai-fs'
import path from 'path'
import tmp from 'tmp'

import { checkIsEmpty, copy, init } from '../../src/tasks/init'
import { checkParam } from './utils-test'

chai.use(chaifs)

describe('INIT TASK', () => {
  let dir
  let promise

  beforeEach(done => {
    dir = tmp.dirSync({ unsafeCleanup: true })
    promise = init({ dir: dir.name }).then(done)
  })

  afterEach(() => {
    dir.removeCallback()
  })

  describe('checkIsEmpty', () => {
    describe('params', () => {
      checkParam('string', 'dir', checkIsEmpty)([1])
    })
    it('returns a promise', () => {
      expect(checkIsEmpty(' ')).to.be.a('promise')
    })
    it('rejects with non empty directory', () => {
      return expect(checkIsEmpty(dir.name)).to.eventually.be.rejected
    })
  })

  describe('copy', () => {
    describe('params', () => {
      checkParam('string', 'dir', copy)([1])
    })
    it('returns a promise', () => {
      expect(copy(dir.name)).to.be.a('promise')
    })
    it('should resolve', () => {
      return expect(copy(dir.name)).to.eventually.be.fulfilled
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

  describe('init', () => {
    describe('params', () => {
      it('throws if object is invalid', () => {
        expect(() => init(' ')).to.throw(
          'parameter `options` expected `object`'
        )
      })
    })
  })
})
