import chai, { assert, expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
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

chai.use(chaiAsPromised)
tmp.setGracefulCleanup()

const dir = path.join(__dirname, 'tmp', 'dev')

const findPort = (host, port) =>
  portscanner.findAPortNotInUse(port, port + 1000, host).then(port => ({
    host,
    port,
    url: `http://${host}:${port}`,
  }))

const occupyPort = (host, port) =>
  new Promise((resolve, reject) =>
    http
      .createServer(() => {})
      .listen(port, host, err => {
        resolve({ host, port })
      })
      .on('error', reject)
  )

const checkResponse = (str, response) =>
  assert.equal(
    response.includes(str),
    true,
    `response is missing string '${str}'`
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
  before(done => {
    init(dir).on('end', () => {
      process.chdir(dir)
      done()
    })
  })

  describe('startReactor', () => {
    it('fails to start when port is in use', () => {
      return expect(
        findPort(defaults.reactorHost, defaults.reactorPort)
          .then(({ host, port }) => occupyPort(host, port))
          .then(({ host, port, server }) => startReactor(host, port))
          .catch(() => server.close())
      ).to.eventually.be.rejected
    })

    it('starts an elm-reactor server when port is free', () => {
      return expect(
        findPort(
          defaults.reactorHost,
          defaults.reactorPort
        ).then(({ host, port }) =>
          startReactor(host, port).then(server => {
            process.kill(-server.pid) // use ESRCH
          })
        )
      ).to.eventually.be.fulfilled
    })
  })

  describe('startExpress', () => {
    it('fails to start when port is in use', () => {
      return expect(
        findPort(defaults.host, defaults.port)
          .then(({ host, port }) => occupyPort(host, port))
          .then(({ host, port, server }) => startExpress(host, port, ''))
          .catch(() => {
            server.close()
          })
      ).to.eventually.be.rejected
    })

    it('starts an express server when port is free', () => {
      return expect(
        findPort(defaults.host, defaults.port).then(({ host, port }) =>
          startExpress(host, port).then(server => {
            server.close()
          })
        )
      ).to.eventually.be.fulfilled
    })

    it('starts the livereload server', function() {
      return expect(
        findPort(defaults.host, defaults.port).then(({ host, port, url }) =>
          startExpress(host, port, null, defaults.lrPort).then(server =>
            occupyPort(null, defaults.lrPort)
          )
        )
      ).to.eventually.be.rejected
    })

    it('creates a virtual static /public dir', done => {
      const tmpDir = tmp.dirSync({ dir, unsafeCleanup: true })
      const tmpFile = tmp.fileSync({ dir: tmpDir.name, postfix: '.css' })
      fs.writeSync(tmpFile.fd, Buffer('.elm-reactor{color:#FFFFFF}'))

      findPort(defaults.host, defaults.port)
        .then(({ host, port, url }) =>
          startExpress(host, port, null, null, tmpDir.name).then(server =>
            request(
              `${url}/public/${path.basename(tmpFile.name)}`
            ).then(response => {
              expect(response).to.eql('.elm-reactor{color:#FFFFFF}')
              tmpFile.removeCallback()
              tmpDir.removeCallback()
              server.close()
              done()
            })
          )
        )
        .catch(done)
    })

    it.only('*.elm files render a custom template', done => {
      findPort(defaults.host, defaults.port).then(({ host, port, url }) =>
        startExpress(host, port, null, null, (req, res) => {
          res.send('<title>elm-factory</elm>')
        }).then(server =>
          request(`${url}/src/Main.elm`)
            .then(response => {
              checkResponse('<title>elm-factory</elm>', response)
              server.close()
              done()
            })
            .catch(done)
        )
      )
    })

    it('proxies elm-reactor', function(done) {
      this.timeout(600000)

      // find an open port
      findPort(defaults.reactorHost, defaults.reactorPort)
        .then(({ host: reactorHost, port: reactorPort, url: reactorUrl }) =>
          // start reactor
          startReactor(reactorHost, reactorPort).then(reactor =>
            // find an open port
            findPort(defaults.host, defaults.port).then(({ host, port, url }) =>
              // start express
              startExpress(host, port, reactorUrl)
                // test proxies
                .then(server =>
                  request(url)
                    .then(res => {
                      checkResponse('<script src="/_reactor/index.js">', res)

                      return request(`${url}/_compile/src/Main.elm`)
                    })
                    .then(response => {
                      checkResponse('var runElmProgram = ')
                      done()
                    })
                )
            )
          )
        )
        .catch(done)
    })
  })

  describe('_template', () => {})

  describe('_css', () => {})

  describe('_main', () => {})
})
