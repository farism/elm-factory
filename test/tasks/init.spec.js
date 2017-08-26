import chai, { assert, expect } from 'chai'
import chaifs from 'chai-fs'
import dirCompare from 'dir-compare'
import path from 'path'
import tmp from 'tmp'

import { initStream } from '../../src/tasks/init'

chai.use(chaifs)

describe('init', () => {
  it('inits the root files', done => {
    const { name: dir } = tmp.dirSync({ unsafeCleanup: true })
    initStream(dir)
      .on('end', () => {
        assert.directoryEqual(dir, path.resolve(__dirname, 'fixture/init'))
        done()
      })
  })
})
