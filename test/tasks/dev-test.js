import chai, { assert, expect } from 'chai'
import chaifs from 'chai-fs'
import dirCompare from 'dir-compare'
import gulp from 'gulp'
import mkdirp from 'mkdirp'
import path from 'path'
import tmp from 'tmp'

import { getWatchedFiles, startReactor } from '../../src/tasks/dev'
import { init } from '../../src/tasks/init'
import { dev as defaults } from '../../src/defaults'

chai.use(chaifs)

describe('dev', function() {
  this.timeout(6000000)

  const dir = path.join(__dirname, 'tmp', 'dev')
  let tmpCleanup = () => {}

  before(done => {
    mkdirp.sync(dir)
    process.chdir(dir)
    init('.').on('end', () => done())
  })

  describe('helpers', () => {
    describe('getWatchedFiles', () => {
      it('given a watcher, returns an array of all watched files', () => {
        expect(
          getWatchedFiles({
            _watcher: {
              _watched: {
                'foo/bar': ['foo/bar', 'ping/pong'],
                'bing/baz': ['bing/baz'],
              },
            },
          })
        ).to.eql(['foo/bar', 'ping/pong', 'bing/baz'])
      })
    })
  })

  describe('_reactor', () => {
    it.only('starts up an elm-reactor process', done => {
      startReactor(defaults.reactorHost, defaults.reactorPort)
        .then(reactor => done())
        .catch(e => {
          // console.error(e)
        })
    })
  })

  describe('_express', () => {})

  describe('_template', () => {})

  describe('_css', () => {})

  describe('_main', () => {})
})
