import chai, { assert, expect } from 'chai'
import chaifs from 'chai-fs'
import dirCompare from 'dir-compare'
import fs from 'fs'
import gulp from 'gulp'
import http from 'http'
import path from 'path'
import portscanner from 'portscanner'
import request from 'request-promise-native'
import tmp from 'tmp'

import {
  getWatchedFiles,
  startReactor,
  startExpress,
} from '../../src/tasks/dev'
import { init } from '../../src/tasks/init'
import { dev as defaults } from '../../src/defaults'

chai.use(chaifs)
tmp.setGracefulCleanup()

const dir = path.join(__dirname, 'tmp', 'dev')

const findPort = (host, port) =>
  portscanner.findAPortNotInUse(port, port + 1000, host)

const occupyPort = (host, port) =>
  new Promise((resolve, reject) =>
    http.createServer(() => {}).listen(port, host, () => {
      resolve(port)
    })
  )

describe('dev', function() {
  this.timeout(6000000)

  before(done => {
    init(dir).on('end', () => {
      process.chdir(dir)
      done()
    })
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
    let port
    let server

    beforeEach(done => {
      findPort(defaults.host, defaults.port).then(_port => {
        port = _port
        done()
      })
    })

    afterEach(() => {
      server && process.kill(-server.pid) // use ESRCH
      server = null
    })

    it('fails when port is in use', done => {
      occupyPort(defaults.reactorHost, port)
        .then(port => startReactor(defaults.reactorHost, port))
        .then(_server => {
          server = _server
          done(new Error('should not succeed when port is not free'))
        })
        .catch(e => done())
    })

    it('starts up an elm-reactor process', done => {
      startReactor(defaults.reactorHost, port)
        .then(_server => {
          server = _server
          done()
        })
        .catch(done)
    })
  })

  describe('startExpress', () => {
    let port
    let server

    beforeEach(done => {
      findPort(defaults.host, defaults.port).then(_port => {
        port = _port
        done()
      })
    })

    afterEach(() => {
      server && server.close()
      server = null
    })

    it('fails when port is in use', done => {
      occupyPort(defaults.host, port)
        .then(port =>
          startExpress(
            defaults.host,
            port,
            'reactor',
            defaults.lrPort,
            '',
            () => {}
          )
        )
        .then(_server => {
          server = _server
          done(new Error('should not succeed when port is taken'))
        })
        .catch(e => done())
    })

    it('starts up an express server', done => {
      startExpress(
        defaults.host,
        port,
        'reactor',
        defaults.lrPort,
        '/',
        () => {}
      )
        .then(_server => {
          server = _server
          done()
        })
        .catch(done)
    })

    it('creates a virtual static /public dir', done => {
      const staticDir = tmp.dirSync({ dir, unsafeCleanup: true })
      const staticFile = tmp.fileSync({ dir: staticDir.name, postfix: '.css' })
      fs.writeSync(staticFile.fd, Buffer('.elm-reactor{color:#FFFFFF}'))

      startExpress(
        defaults.host,
        port,
        'reactor',
        defaults.lrPort,
        staticDir.name,
        () => {}
      )
        .then(_server => {
          server = _server

          return request(
            `http://${defaults.host}:${port}/public/${path.basename(
              staticFile.name
            )}`
          ).then(response => {
            expect(response).to.eql('.elm-reactor{color:#FFFFFF}')
            done()
          })
        })
        .catch(done)
    })
  })

  describe('_template', () => {})

  describe('_css', () => {})

  describe('_main', () => {})
})
