import chai, { assert, expect } from 'chai'
import chaifs from 'chai-fs'
import dirCompare from 'dir-compare'
import gulp from 'gulp'
import http from 'http'
import mkdirp from 'mkdirp'
import path from 'path'
import portscanner from 'portscanner'
import tmp from 'tmp'

import {
  getWatchedFiles,
  startReactor,
  startExpress,
} from '../../src/tasks/dev'
import { init } from '../../src/tasks/init'
import { dev as defaults } from '../../src/defaults'

chai.use(chaifs)

const dir = path.join(__dirname, 'tmp', 'dev')

const createOccupiedServer = (host, port) =>
  new Promise((resolve, reject) => {
    http.createServer(() => {}).listen(port, host, () => {
      resolve(port)
    })
  })

const getPort = (host, port) => () =>
  portscanner.findAPortNotInUse(port, port + 1000, host)

const getReactorPort = getPort(defaults.reactorHost, defaults.reactorPort)

const getExpressPort = getPort(defaults.host, defaults.port)

describe.only('dev', function() {
  this.timeout(6000000)

  before(done => {
    mkdirp.sync(dir)
    process.chdir(dir)
    init('.').on('end', () => done())
  })

  describe('helpers', () => {
    describe('getWatchedFiles', () => {
      it('given a watcher, returns an array of all watched files', () => {
        const actual = getWatchedFiles({
          _watcher: {
            _watched: {
              'foo/bar': ['foo/bar', 'ping/pong'],
              'bing/baz': ['bing/baz'],
            },
          },
        })

        expect(['foo/bar', 'ping/pong', 'bing/baz']).to.eql(actual)
      })
    })
  })

  describe('startReactor', () => {
    it('fails when port is in use', done => {
      getReactorPort()
        .then(port => createOccupiedServer(defaults.reactorHost, port))
        .then(port => startReactor(defaults.reactorHost, port))
        .then(() => done(new Error('should not succeed when port is not free')))
        .catch(e => done())
    })

    it('starts up an elm-reactor process', done => {
      getReactorPort()
        .then(port => startReactor(defaults.reactorHost, port))
        .then(() => done())
        .catch(e => done(new Error('should not fail when port is free')))
    })
  })

  describe('startExpress', () => {
    let tmpDir = ''
    let tmpCleanup = () => {}

    before(() => {})

    beforeEach(() => {
      const { name, removeCallback } = tmp.dirSync({ dir, unsafeCleanup: true })

      tmpDir = name
      tmpCleanup = removeCallback
    })

    afterEach(() => {
      tmpCleanup()
    })

    it('fails when port is in use', done => {
      getExpressPort()
        .then(port => createOccupiedServer(defaults.host, port))
        .then(port =>
          startExpress(
            tmpDir,
            defaults.host,
            port,
            'reactor',
            defaults.lrPort,
            () => {}
          )
        )
        .then(() => done(new Error('should not succeed when port is not free')))
        .catch(e => done())
    })

    it('starts up an express server', done => {
      getExpressPort()
        .then(port =>
          startExpress(
            tmpDir,
            defaults.host,
            port,
            'reactor',
            defaults.lrPort,
            () => {}
          )
        )
        .then(() => done())
        .catch(e => done(new Error('should not fail when port is free')))
    })
  })

  describe('_template', () => {})

  describe('_css', () => {})

  describe('_main', () => {})
})
