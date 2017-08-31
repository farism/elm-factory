import chai, { assert, expect } from 'chai'
import chaifs from 'chai-fs'
import chaiAsPromised from 'chai-as-promised'
import fs from 'fs'
import http from 'http'
import gulp from 'gulp'
import path from 'path'
import portscanner from 'portscanner'
import request from 'request-promise-native'
import sinon from 'sinon'
import tmp from 'tmp'

import {
  defaultHtmlCompiler,
  getDepTree,
  loadHtmlCompiler,
  writeResponse,
  installPackages,
  startReactor,
  startBrowserSync,
  watch,
  task,
} from '../../src/tasks/dev'
import { init } from '../../src/tasks/init'
import { dev as defaults } from '../../src/defaults'

chai.use(chaifs)
chai.use(chaiAsPromised)
tmp.setGracefulCleanup()

const dir = path.join(__dirname, 'tmp')

const required = name => `parameter \`${name}\` is required`

const type = (type, name) => `parameter \`${name}\` must be a \`${type}\``

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

const assertIncludes = (str = '', response = '') =>
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

  describe('helpers', () => {
    describe('defaultHtmlCompiler', () => {
      it('defaultHtmlCompiler', () => {
        return expect(defaultHtmlCompiler()).to.eventually.equal(
          'incompatible html template...'
        )
      })
    })
  })

  describe('installPackages', function() {
    this.timeout(60000)

    it('should install elm deps into /elm-stuff', done => {
      const tmpDir = tmp.dirSync({ dir, unsafeCleanup: true, keep: true })

      let install
      init(tmpDir.name).on('end', () => {
        install = installPackages(tmpDir.name)
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

  describe('startReactor', () => {
    describe.only('arguments', () => {
      describe('host', () => {
        it('is required', () => {
          expect(() => startReactor()).to.throw(required('host'))
        })
        it('must be a string', () => {
          expect(() => startReactor(127001)).to.throw(
            type('string', 'host')
          )
        })
      })
      describe('port', () => {
        it('is required', () => {
          expect(() => startReactor('stub')).to.throw(required('port'))
        })
        it('must be a number', () => {
          expect(() => startReactor('stub', '8000')).to.throw(
            type('number', 'port')
          )
        })
      })
    })

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

  describe('startBrowserSync', () => {
    describe('arguments', () => {
      describe('host', () => {
        it('is required', () => {
          expect(() => startBrowserSync()).to.throw(required('host'))
        })
        it('must be a string', () => {
          expect(() => startBrowserSync(127001)).to.throw(
            type('string', 'host')
          )
        })
      })
      describe('port', () => {
        it('is required', () => {
          expect(() => startBrowserSync('stub')).to.throw(required('port'))
        })
        it('must be a number', () => {
          expect(() => startBrowserSync('stub', '8000')).to.throw(
            type('number', 'port')
          )
        })
      })
      describe('reactor', () => {
        it('is required', () => {
          expect(() => startBrowserSync('stub', 123)).to.throw(
            required('reactor')
          )
        })
        it('must be a string', () => {
          expect(() => startBrowserSync('stub', 123, 321)).to.throw(
            type('string', 'reactor')
          )
        })
      })
      describe('index', () => {
        it('is required', () => {
          expect(() => startBrowserSync('stub', 123, 'stub')).to.throw(
            required('html')
          )
        })
        it('must be a string', () => {
          expect(() => startBrowserSync('stub', 123, 'stub', 321)).to.throw(
            type('string', 'html')
          )
        })
      })
      describe('dir', () => {
        it('is required', () => {
          expect(() => startBrowserSync('stub', 123, 'stub', 'stub')).to.throw(
            required('dir')
          )
        })
        it('must be a string', () => {
          expect(() =>
            startBrowserSync('stub', 123, 'stub', 'stub', 321)
          ).to.throw(type('string', 'dir'))
        })
      })
    })

    it('starts a browsersync server', () => {
      return expect(
        startBrowserSync(
          defaults.host,
          defaults.port,
          'stub',
          'stub',
          'stub'
        ).then(({ bs }) => {
          bs.exit()
        })
      ).to.eventually.be.fulfilled
    })

    it('serves static from the /public dir', done => {
      const tmpDir = tmp.dirSync({ dir, unsafeCleanup: true })
      const tmpFile = tmp.fileSync({ dir: tmpDir.name, postfix: '.css' })
      const basename = path.basename(tmpFile.name)
      fs.writeSync(tmpFile.fd, Buffer('.elm-reactor{color:#FFFFFF}'))

      startBrowserSync(
        defaults.host,
        defaults.port,
        'stub',
        'stub',
        tmpDir.name
      ).then(({ bs }) =>
        request(
          `http://${defaults.host}:${defaults.port}/public/${basename}`
        ).then(res => {
          expect(res).to.eql('.elm-reactor{color:#FFFFFF}')
          tmpFile.removeCallback()
          tmpDir.removeCallback()
          bs.exit()
          done()
        })
      )
    })

    it('*.elm files render a custom html template', done => {
      startBrowserSync(
        defaults.host,
        defaults.port,
        'stub',
        './index.ejs',
        'stub'
      ).then(({ bs }) =>
        request(`http://${defaults.host}:${defaults.port}/src/Main.elm`)
          .then(res => {
            assertIncludes('<title>~/src/Main.elm</title>', res)
            bs.exit()
            done()
          })
          .catch(done)
      )
    })

    it('proxies elm-reactor', function(done) {
      this.timeout(60000)

      findFreePort(defaults.reactorHost, defaults.reactorPort)
        .then(({ host: reactorHost, port: reactorPort, url: reactorUrl }) =>
          startReactor(reactorHost, reactorPort, false).then(reactor =>
            startBrowserSync(
              defaults.host,
              defaults.port,
              reactorUrl,
              'stub',
              'stub'
            ).then(({ bs }) =>
              request(`http://${defaults.host}:${defaults.port}`)
                .then(res => {
                  assertIncludes('<script src="/_reactor/index.js">', res)

                  return request(
                    `http://${defaults.host}:${defaults.port}/_compile/src/Main.elm`
                  )
                })
                .then(res => {
                  assertIncludes('var runElmProgram = ', res)
                  reactor.close()
                  bs.exit()
                  done()
                })
            )
          )
        )
        .catch(done)
    })
  })

  // describe('watch', () => {
  //   it('should throw if param `filter` exists and is not a function', () => {
  //     expect(() => watch(0)).to.throw()
  //     expect(() => watch(false)).to.throw()
  //     expect(() => watch('')).to.throw()
  //   })
  //   it('returns a function', () => {
  //     expect(watch()).to.be.a('function')
  //   })
  //   describe('returned function', () => {
  //     it('should throw if param `watcher` is missing', () => {
  //       return expect(watch()(null, 'src')).to.be.eventually.be.rejected
  //     })
  //     it('should throw if param `src` is missing', () => {
  //       return expect(watch()({}, null)).to.eventually.be.rejected
  //     })
  //     it('should watch the correct files', () => {
  //       return expect(
  //         watch()(gulp.watch(defaults.main), defaults.main)
  //       ).to.eventually.eql([
  //         path.join(dir, 'src/Assets.elm'),
  //         path.join(dir, 'src/Main.elm'),
  //         path.join(dir, 'src/MainCss.elm'),
  //         path.join(dir, 'src/assets/'),
  //       ])
  //     })
  //     it('should watch the correct files', () => {
  //       return expect(
  //         watch()(gulp.watch(defaults.stylesheets), defaults.stylesheets)
  //       ).to.eventually.eql([
  //         path.join(dir, 'src/Assets.elm'),
  //         path.join(dir, 'src/MainCss.elm'),
  //         path.join(dir, 'src/Stylesheets.elm'),
  //         path.join(dir, 'src/assets/'),
  //       ])
  //     })
  //     it('should watch and filter out the correct files', () => {
  //       const watcher = gulp.watch(defaults.stylesheets)
  //       const filter = file =>
  //         !getWatchedPaths(watcher).assertIncludes(file.path)
  //
  //       return expect(
  //         watch()(watcher, defaults.stylesheets).then(() =>
  //           watch(filter)(gulp.watch(defaults.main), defaults.main)
  //         )
  //       ).to.eventually.eql([
  //         path.join(dir, 'src/Main.elm'),
  //         path.join(dir, 'src/assets/'),
  //       ])
  //     })
  //   })
  // })
})
