import chai, { assert, expect } from 'chai'
import chaifs from 'chai-fs'
import chaiAsPromised from 'chai-as-promised'
import check from 'check-types'
import fs from 'fs'
import path from 'path'
import sinon from 'sinon'
import tmp from 'tmp'

import {
  invalidParam,
  validateParam,
  installPackages,
} from '../../src/tasks/utils'
import { init } from '../../src/tasks/init'

chai.use(chaifs)
chai.use(chaiAsPromised)

const dir = path.join(__dirname, 'tmp')

export const checkParam = (type, name, testFn, required = true) => (
  params = []
) => {
  it(`\`${name}\` param is validated`, () => {
    if (required) {
      expect(() => testFn.apply(null, params.slice(0, -1))).to.throw(
        invalidParam(type, name)
      )
    }
    expect(() => testFn.apply(null, params)).to.throw(invalidParam(type, name))
  })
}

describe('UTILS', function() {
  describe('invalidParam', () => {
    it('returns the correct message', () => {
      expect(invalidParam('foo', 'bar')).to.eql(
        'parameter `bar` expected `foo`'
      )
    })
  })

  describe('validateParam', () => {
    it('throws when param is required and missing', () => {
      expect(() => validateParam('string', 'stub')).to.throw(
        invalidParam('string', 'stub')
      )
    })
    it('throws when param is required and provided with invalid type', () => {
      expect(() => validateParam('string', 'stub', 123)).to.throw(
        invalidParam('string', 'stub')
      )
    })
    it('throws when param is not required and provided with invalid type', () => {
      expect(() => validateParam('string', 'stub', 123, false)).to.throw(
        invalidParam('string', 'stub')
      )
    })
    it('does not throw when param is not required and provided with undefined or null', () => {
      expect(() => validateParam('string', 'stub', null, false)).to.not.throw()
    })
  })

  describe('installPackages', () => {
    let tmpDir
    let promise

    before(done => {
      init({ dir }).then(() => {
        process.chdir(dir)
        tmpDir = tmp.dirSync({ dir, unsafeCleanup: true })
        promise = installPackages(tmpDir.name)
        done()
      })
    })

    it('returns a promise', () => {
      expect(promise).to.be.a('promise')
    })
    it('resolves if successful', () => {
      return expect(promise).to.eventually.be.fulfilled
    })
    it('rejects if unsuccessful', () => {
      return expect(installPackages('BADPATH')).to.eventually.be.rejected
    })
    it('installs elm deps into /elm-stuff', function(done) {
      this.timeout(60000)

      promise
        .then(() => {
          expect(path.join(dir, 'elm-stuff')).to.be.a.directory()
          tmpDir.removeCallback()
          done()
        })
        .catch(() => {
          tmpDir.removeCallback()
          done()
        })
    })
  })
})
