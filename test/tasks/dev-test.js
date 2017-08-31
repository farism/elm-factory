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
  param,
  defaultHtmlCompiler,
  getDepTree,
  loadHtmlCompiler,
  getSpinner,
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

  describe.only('helpers', () => {
    describe('param', () => {
      it('throws type errors', () => {
        expect(() => param('string', 'a')).to.throw(TypeError)
        expect(() => param('string', 'a', 123)).to.throw(TypeError)
      })
      it('validates existence', () => {
        expect(() => param('string', 'a')).to.throw(required('a'))
        expect(() => param('number', 'a', undefined)).to.throw(required('a'))
        expect(() => param('function', 'a', null)).to.throw(required('a'))
      })
      it('works with booleans', () => {
        expect(() => param('boolean', 'a', true)).to.not.throw()
        expect(() => param('boolean', 'a', [])).to.throw(type('boolean', 'a'))
        expect(() => param('boolean', 'a', {})).to.throw(type('boolean', 'a'))
        expect(() => param('boolean', 'a', 123)).to.throw(type('boolean', 'a'))
        expect(() => param('boolean', 'a', '123')).to.throw(
          type('boolean', 'a')
        )
      })
      it('works with objects', () => {
        expect(() => param('object', 'a', {})).to.not.throw()
        expect(() => param('object', 'a', [])).to.throw(type('object', 'a'))
        expect(() => param('object', 'a', true)).to.throw(type('object', 'a'))
        expect(() => param('object', 'a', 123)).to.throw(type('object', 'a'))
        expect(() => param('object', 'a', '123')).to.throw(type('object', 'a'))
      })
      it('works with arrays', () => {
        expect(() => param('array', 'a', [])).to.not.throw()
        expect(() => param('array', 'a', {})).to.throw(type('array', 'a'))
        expect(() => param('array', 'a', true)).to.throw(type('array', 'a'))
        expect(() => param('array', 'a', 123)).to.throw(type('array', 'a'))
        expect(() => param('array', 'a', '123')).to.throw(type('array', 'a'))
      })
      it('works with numbers', () => {
        expect(() => param('number', 'a', 123)).to.not.throw()
        expect(() => param('number', 'a', [])).to.throw(type('number', 'a'))
        expect(() => param('number', 'a', {})).to.throw(type('number', 'a'))
        expect(() => param('number', 'a', true)).to.throw(type('number', 'a'))
        expect(() => param('number', 'a', '123')).to.throw(type('number', 'a'))
      })
      it('works with strings', () => {
        expect(() => param('string', 'a', '123')).to.not.throw()
        expect(() => param('string', 'a', [])).to.throw(type('string', 'a'))
        expect(() => param('string', 'a', {})).to.throw(type('string', 'a'))
        expect(() => param('string', 'a', true)).to.throw(type('string', 'a'))
        expect(() => param('string', 'a', 123)).to.throw(type('string', 'a'))
      })
    })
    describe('getDepTree', () => {
      describe('params', () => {
        describe('entry', () => {
          it('is required', () => {
            expect(() => getDepTree()).to.throw(required('entry'))
          })
          it('must be a string', () => {
            expect(() => getDepTree(1223)).to.throw(type('string', 'entry'))
          })
        })
      })
      it('fails if entry file does not exist', () => {
        return expect(getDepTree('some/fake/path.elm')).to.eventually.rejected
      })
      it('returns an elm dependency tree with the entry point prepended', () => {
        return expect(getDepTree('src/Main.elm')).to.eventually.deep.equal([
          'src/Main.elm',
          path.join(dir, 'src/MainCss.elm'),
          path.join(dir, 'src/Assets.elm'),
        ])
      })
    })

    describe('loadHtmlCompiler', () => {
      describe('params', () => {
        describe('file', () => {
          it('is required', () => {
            expect(() => loadHtmlCompiler()).to.throw(required('file'))
          })
          it('must be a string', () => {
            expect(() => loadHtmlCompiler(123)).to.throw(type('string', 'file'))
          })
        })
      })
      it('fails if html file does not exist', () => {
        return expect(loadHtmlCompiler('some/fake/path.ejs')).to.eventually.be
          .rejected
      })
      it('fails if html file exists but is not supported', () => {
        const tmpFile = tmp.fileSync({ dir, postfix: '.unsupported' })

        return expect(
          loadHtmlCompiler(tmpFile.name)
        ).to.eventually.be.rejectedWith(
          Error,
          'html template format unsupported'
        )
      })
      it('resolves with an existing and supported html file', () => {
        return expect(loadHtmlCompiler(defaults.html)).to.eventually.be
          .fulfilled
      })
      it('resolves a function', () => {
        return expect(loadHtmlCompiler(defaults.html)).to.eventually.be.a(
          'function'
        )
      })
    })

    describe.only('getSpinner', () => {
      describe('params', () => {
        describe('steps', () => {
          it('is required', () => {
            expect(() => getSpinner()).to.throw(required('steps'))
          })
          it('must be an array', () => {
            expect(() => getSpinner(123)).to.throw(type('array', 'steps'))
          })
        })
        describe('spinner', () => {
          it('is required', () => {
            expect(() => getSpinner([])).to.throw(required('spinner'))
          })
          it('must be an object', () => {
            expect(() => getSpinner([], 'stub')).to.throw(
              type('object', 'spinner')
            )
          })
        })
      })
      describe('returns', () => {
        let spinner
        let start = sinon.spy()
        let stop = sinon.spy()
        let succeed = sinon.spy()
        let fail = sinon.spy()
        beforeEach(() => {
          spinner = getSpinner(['step1', 'step2', 'step3'], {
            start,
            stop,
            succeed,
            fail,
          })
        })

        afterEach(() => {
          start.reset()
          stop.reset()
          succeed.reset()
          fail.reset()
        })

        it('a spinner instance', () => {
          expect(spinner).to.have.a.property('succeed').that.is.a('function')
        })
        it('adds a #current() method', () => {
          expect(spinner).to.have.a.property('current').that.is.a('function')
        })
        it('adds a #next() method', () => {
          expect(spinner).to.have.a.property('next').that.is.a('function')
        })
        describe('#current()', () => {
          it('returns the value of the current step index', () => {
            expect(spinner.current()).to.eql('step1')
          })
        })
        describe('#next()', () => {
          it('increments the step', () => {
            spinner.next()
            expect(spinner.current()).to.eql('step2')
            spinner.next()
            expect(spinner.current()).to.eql('step3')
            spinner.next()
            expect(spinner.current()).to.eql('step3')
          })
          it('does not go past the last step', () => {
            spinner.next().next().next().next().next().next()
            expect(spinner.current()).to.eql('step3')
          })
          it('calls fn with new step', () => {
            const fn = sinon.spy()
            spinner.next(fn)
            spinner.next(fn)
            expect(fn.callCount).to.eql(2)
          })
        })
      })
    })

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
      const tmpDir = tmp.dirSync({ dir, unsafeCleanup: true })

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
    describe('params', () => {
      describe('host', () => {
        it('is required', () => {
          expect(() => startReactor()).to.throw(required('host'))
        })
        it('must be a string', () => {
          expect(() => startReactor(127001)).to.throw(type('string', 'host'))
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
    describe('params', () => {
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
