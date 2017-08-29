import chai, { assert, expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import fs from 'fs'
import http from 'http'
import gulp from 'gulp'
import path from 'path'
import portscanner from 'portscanner'
import request from 'request-promise-native'
import sinon from 'sinon'
import tinylr from 'tiny-lr'
import tmp from 'tmp'

import {
  compileCss,
  compileMain,
  compileHtml,
  defaultHtmlCompiler,
  getWatchedPaths,
  resetWatcher,
  startReactor,
  startExpress,
  task,
  watch,
  watchCss,
  watchMain,
} from '../../src/tasks/dev'
import { init } from '../../src/tasks/init'
import { dev as defaults } from '../../src/defaults'

chai.use(chaiAsPromised)
tmp.setGracefulCleanup()

const dir = path.join(__dirname, 'tmp', 'dev')

const findFreePort = (host, port) =>
  portscanner.findAPortNotInUse(port, port + 1000, host).then(port => {
    return {
      host,
      port,
      url: `http://${host}:${port}`,
    }
  })

const occupyPort = (host, port) =>
  new Promise((resolve, reject) => {
    const server = http.createServer(() => {})
    server
      .listen(port, host, err => {
        resolve({ host, port, server })
      })
      .on('error', reject)
  })

const includes = (str = '', response = '') =>
  assert.equal(
    response.includes(str),
    true,
    `response is missing string '${str}'`
  )

describe('dev', function() {
  before(done => {
    init(dir).on('end', () => {
      process.chdir(dir)
      done()
    })
  })

  describe('task', () => {
    it('adds the tasks to gulp', () => {
      const gulp = task({})
      expect(gulp.tasks).to.have.a.property('_html')
      expect(gulp.tasks).to.have.a.property('_css')
      expect(gulp.tasks).to.have.a.property('_main')
      expect(gulp.tasks).to.have.a.property('dev')
    })
  })

  describe('helpers', () => {
    describe('defaultHtmlCompiler', () => {
      it('defaultHtmlCompiler', () => {
        return expect(defaultHtmlCompiler()).to.eventually.equal(
          'html is compiling...'
        )
      })
    })

    describe('getWatchedPaths', () => {
      it('given a watcher, returns an array of all watched paths', () => {
        expect(
          getWatchedPaths(gulp.watch(path.join(dir, 'src', '**')))
        ).to.eql([
          path.join(dir, 'src/'),
          path.join(dir, 'src/Assets.elm'),
          path.join(dir, 'src/Main.elm'),
          path.join(dir, 'src/MainCss.elm'),
          path.join(dir, 'src/Stylesheets.elm'),
          path.join(dir, 'src/assets/'),
          path.join(dir, 'src/assets/css3.png'),
        ])

        expect(
          getWatchedPaths(gulp.watch(path.join(dir, 'src', 'fakedir')))
        ).to.eql([])
      })
    })
  })

  describe('startReactor', () => {
    it('fails to start when port is in use', () => {
      return expect(
        findFreePort(defaults.reactorHost, defaults.reactorPort)
          .then(({ host, port }) => occupyPort(host, port))
          .then(({ host, port, server }) =>
            startReactor(host, port, false).catch(() => {
              server.close()
              throw new Error()
            })
          )
      ).to.eventually.be.rejected
    })

    it('starts an elm-reactor server when port is free', () => {
      return expect(
        findFreePort(
          defaults.reactorHost,
          defaults.reactorPort
        ).then(({ host, port }) =>
          startReactor(host, port, false).then(server => {
            server.close()
          })
        )
      ).to.eventually.be.fulfilled
    })
  })

  describe('startExpress', () => {
    it('fails to start when port is in use', () => {
      return expect(
        findFreePort(defaults.host, defaults.port)
          .then(({ host, port }) => occupyPort(host, port))
          .then(({ host, port, server }) =>
            startExpress(host, port, '').catch(() => {
              server.close()
              throw new Error()
            })
          )
      ).to.eventually.be.rejected
    })

    it('starts an express server when port is free', () => {
      return expect(
        findFreePort(defaults.host, defaults.port).then(({ host, port }) =>
          startExpress(host, port).then(server => {
            server.close()
          })
        )
      ).to.eventually.be.fulfilled
    })

    it('starts the livereload server', function() {
      const lrPort = defaults.lrPort + 1
      return expect(
        findFreePort(defaults.host, defaults.port).then(({ host, port, url }) =>
          startExpress(host, port, null, lrPort).then(server =>
            occupyPort(null, lrPort).catch(() => {
              // server.close()
              throw new Error()
            })
          )
        )
      ).to.eventually.be.rejected
    })

    it('creates a virtual static /public dir', done => {
      const tmpDir = tmp.dirSync({ dir, unsafeCleanup: true })
      const tmpFile = tmp.fileSync({ dir: tmpDir.name, postfix: '.css' })
      fs.writeSync(tmpFile.fd, Buffer('.elm-reactor{color:#FFFFFF}'))

      findFreePort(defaults.host, defaults.port)
        .then(({ host, port, url }) =>
          startExpress(host, port, null, null, null, tmpDir.name).then(server =>
            request(
              `${url}/public/${path.basename(tmpFile.name)}`
            ).then(res => {
              expect(res).to.eql('.elm-reactor{color:#FFFFFF}')
              tmpFile.removeCallback()
              tmpDir.removeCallback()
              server.close()
              done()
            })
          )
        )
        .catch(done)
    })

    it('*.elm files render a custom html template', done => {
      findFreePort(defaults.host, defaults.port).then(({ host, port, url }) =>
        startExpress(host, port, null, null, (req, res) => {
          res.send('<title>elm-factory</elm>')
        }).then(server =>
          request(`${url}/src/Main.elm`)
            .then(res => {
              includes('<title>elm-factory</elm>', res)
              server.close()
              done()
            })
            .catch(done)
        )
      )
    })

    it('proxies elm-reactor', function(done) {
      this.timeout(60000)

      findFreePort(defaults.reactorHost, defaults.reactorPort)
        .then(({ host: reactorHost, port: reactorPort, url: reactorUrl }) =>
          startReactor(reactorHost, reactorPort, false).then(reactor =>
            findFreePort(
              defaults.host,
              defaults.port
            ).then(({ host, port, url }) =>
              startExpress(host, port, reactorUrl).then(server =>
                request(url)
                  .then(res => {
                    includes('<script src="/_reactor/index.js">', res)

                    return request(`${url}/_compile/src/Main.elm`)
                  })
                  .then(res => {
                    includes('var runElmProgram = ', res)
                    reactor.close()
                    server.close()
                    done()
                  })
              )
            )
          )
        )
        .catch(done)
    })
  })

  describe('compileHtml', () => {
    it('should throw if param `html` is missing', () => {
      expect(() => compileHtml()).to.throw()
    })
    describe('return', () => {
      it('is a stream', () => {
        expect(compileHtml(defaults.html)).to.have.property('pipe')
      })
    })
  })

  describe('compileCss', () => {
    it('should throw if param `out` is missing', () => {
      expect(() => compileCss(null, defaults.stylesheets)).to.throw()
    })
    it('should throw if param `stylesheets` is missing', () => {
      expect(() => compileCss(dir, null)).to.throw()
    })
    it('should throw if param `cwd` is invalid', () => {
      expect(() => compileCss(dir, null, 'foo/bar/xyz')).to.throw()
    })
    describe('return', () => {
      it('is a stream that livereloads', function(done) {
        this.timeout(60000)

        const tmpDir = tmp.dirSync({ dir, unsafeCleanup: true })
        const changed = sinon.spy()
        tinylr.changed = changed

        const compile = compileCss(tmpDir.name, defaults.stylesheets)
        expect(compile).to.have.property('pipe')

        compile.on('end', () => {
          tmpDir.removeCallback()
          expect(changed.callCount).to.eql(1)
          done()
        })
      })
    })
  })

  describe('watch', () => {
    it('should throw if param `filter` exists and is not a function', () => {
      expect(() => watch(0)).to.throw()
      expect(() => watch(false)).to.throw()
      expect(() => watch('')).to.throw()
    })
    it('returns a function', () => {
      expect(watch()).to.be.a('function')
    })
    describe('returned function', () => {
      it('should throw if param `watcher` is missing', () => {
        return expect(watch()(null, 'src')).to.be.eventually.be.rejected
      })
      it('should throw if param `src` is missing', () => {
        return expect(watch()({}, null)).to.eventually.be.rejected
      })
      it('should watch the correct files', () => {
        return expect(
          watch()(gulp.watch(defaults.main), defaults.main)
        ).to.eventually.eql([
          path.join(dir, 'src/Assets.elm'),
          path.join(dir, 'src/Main.elm'),
          path.join(dir, 'src/MainCss.elm'),
          path.join(dir, 'src/assets/'),
        ])
      })
      it('should watch the correct files', () => {
        return expect(
          watch()(gulp.watch(defaults.stylesheets), defaults.stylesheets)
        ).to.eventually.eql([
          path.join(dir, 'src/Assets.elm'),
          path.join(dir, 'src/MainCss.elm'),
          path.join(dir, 'src/Stylesheets.elm'),
          path.join(dir, 'src/assets/'),
        ])
      })
      it('should watch and filter out the correct files', () => {
        const watcher = gulp.watch(defaults.stylesheets)
        const filter = file => !getWatchedPaths(watcher).includes(file.path)

        return expect(
          watch()(watcher, defaults.stylesheets).then(() =>
            watch(filter)(gulp.watch(defaults.main), defaults.main)
          )
        ).to.eventually.eql([
          path.join(dir, 'src/Main.elm'),
          path.join(dir, 'src/assets/'),
        ])
      })
    })
  })
})
