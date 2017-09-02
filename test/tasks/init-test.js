import chai, { assert, expect } from 'chai'
import chaifs from 'chai-fs'
import path from 'path'
import tmp from 'tmp'

import { isEmpty, copy, init } from '../../src/tasks/init'
import { checkParam } from './utils-test'

chai.use(chaifs)

describe('INIT TASK', () => {
  let dir

  beforeEach(() => {
    dir = tmp.dirSync({ unsafeCleanup: true })
  })

  afterEach(() => {
    dir.removeCallback()
  })

  describe('isEmpty', () => {
    describe('params', () => {
      checkParam('string', 'dir', isEmpty)([1])
    })
    it('returns a promise', () => {
      expect(isEmpty(' ')).to.be.a('promise')
    })
    it('resolves with true if the directory is empty', () => {
      return expect(isEmpty('some/random/dir')).to.eventually.equal(true)
      return expect(isEmpty(dir.name)).to.eventually.equal(false)
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
    it('directory has the correct files', () => {
      return copy(dir.name).then(() => {
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
    })
    it('compiles template files with absolute dir slug', () => {
      const slug = dir.name.split('/').pop()

      return copy(dir.name).then(() => {
        expect(path.join(dir.name, 'elm-package.json'))
          .to.be.a.file()
          .with.contents.that.match(new RegExp(`"summary": "${slug}"`))

        expect(path.join(dir.name, 'package.json'))
          .to.be.a.file()
          .with.contents.that.match(new RegExp(`"name": "${slug}"`))
      })
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
    it('returns a promise', () => {
      return expect(init({ dir: dir.name })).to.be.a('promise')
    })
    it('resolves if dir is empty', () => {
      return expect(init({ dir: dir.name })).to.eventually.be.fulfilled
    })
    it('force resolves even if dir is not empty', () => {
      return expect(
        init({ dir: dir.name }).then(() => init({ dir: dir.name, force: true }))
      ).to.eventually.be.fulfilled
    })
  })
})
