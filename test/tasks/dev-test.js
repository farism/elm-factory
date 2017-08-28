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
      resolve()
    })
  )

describe('dev helpers', () => {
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

describe('dev tasks', function() {
  let expressPort
  let expressUrl
  let reactorPort
  let reactorUrl

  this.timeout(6000000)

  before(done => {
    init(dir).on('end', () => {
      process.chdir(dir)
      done()
    })
  })

  beforeEach(done => {
    findPort(defaults.host, defaults.port)
      .then(port => {
        expressPort = port
        expressUrl = `http://${defaults.host}:${expressPort}`

        return findPort(defaults.reactorHost, defaults.reactorPort)
      })
      .then(port => {
        reactorPort = port
        reactorUrl = `http://${defaults.reactorHost}:${reactorPort}`
        done()
      })
  })

  describe('startReactor', () => {
    it('fails when port is in use', done => {
      occupyPort(defaults.reactorHost, reactorPort)
        .then(() => startReactor(defaults.reactorHost, reactorPort))
        .then(() => {
          done(new Error('should not succeed when port is not free'))
        })
        .catch(e => done())
    })

    it('starts up an elm-reactor process', done => {
      startReactor(defaults.reactorHost, reactorPort)
        .then(server => {
          process.kill(-server.pid) // use ESRCH
          done()
        })
        .catch(done)
    })
  })

  describe('startExpress', () => {
    it('fails when port is in use', done => {
      occupyPort(defaults.host, expressPort)
        .then(port => startExpress(defaults.host, expressPort, ''))
        .then(server => {
          server.close()
          done(new Error('should not succeed when port is taken'))
        })
        .catch(e => done())
    })

    it('starts up an express server', done => {
      startExpress(defaults.host, expressPort, 'reactor', defaults.lrPort, '/')
        .then(server => {
          server.close()
          done()
        })
        .catch(done)
    })

    it('creates a virtual static /public dir', done => {
      const staticDir = tmp.dirSync({ dir })
      const staticFile = tmp.fileSync({ dir: staticDir.name, postfix: '.css' })
      fs.writeSync(staticFile.fd, Buffer('.elm-reactor{color:#FFFFFF}'))

      startExpress(defaults.host, expressPort, null, null, staticDir.name)
        .then(server =>
          request(
            `${expressUrl}/public/${path.basename(staticFile.name)}`
          ).then(response => {
            expect(response).to.eql('.elm-reactor{color:#FFFFFF}')
            staticFile.removeCallback()
            staticDir.removeCallback()
            server.close()
            done()
          })
        )
        .catch(done)
    })

    it.only('proxies elm-reactor', done => {
      startReactor(defaults.reactorHost, reactorPort)
        .then(reactor =>
          startExpress(defaults.host, expressPort, reactorUrl).then(server =>
            request(expressUrl).then(response => {
              expect(response).to.include('<script src="/_reactor/index.js">')
              done()
            })
          )
        )
        .catch(done)
    })
  })

  describe('_template', () => {})

  describe('_css', () => {})

  describe('_main', () => {})
})
