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
  writeResponse,
  installPackages,
  startReactor,
  startBrowserSync,
  createWatcher,
  watch,
  dev,
} from '../../src/tasks/dev'
import { init } from '../../src/tasks/init'
import { dev as defaults } from '../../src/defaults'

chai.should()
chai.use(chaifs)
chai.use(chaiAsPromised)
tmp.setGracefulCleanup()

const dir = path.join(__dirname, 'tmp')

const fn = () => {}
const obj = {}
const arr = []
const str = 'stub'
const num = 123
const bool = true

const required = name => `parameter \`${name}\` is required`

const ntype = (type, name) => `parameter \`${name}\` must be a \`${type}\``

const checkParam = (type, name, fn) => args => {
  it(`${name} is required`, () => {
    expect(() => fn.apply(null, args.slice(0, -1))).to.throw(required(name))
  })
  it(`${name} must be a ${type}`, () => {
    expect(() => fn.apply(null, args)).to.throw(ntype(type, name))
  })
}

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

describe('DEV TASK', function() {
  before(done => {
    init({ dir }).then(() => {
      process.chdir(dir)
      done()
    })
  })

  describe('helpers', () => {
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
        expect(() => param('boolean', 'a', bool)).to.not.throw()
        expect(() => param('boolean', 'a', arr)).to.throw(ntype('boolean', 'a'))
        expect(() => param('boolean', 'a', obj)).to.throw(ntype('boolean', 'a'))
        expect(() => param('boolean', 'a', num)).to.throw(ntype('boolean', 'a'))
        expect(() => param('boolean', 'a', str)).to.throw(ntype('boolean', 'a'))
      })
      it('works with objects', () => {
        expect(() => param('object', 'a', obj)).to.not.throw()
        expect(() => param('object', 'a', arr)).to.throw(ntype('object', 'a'))
        expect(() => param('object', 'a', bool)).to.throw(ntype('object', 'a'))
        expect(() => param('object', 'a', num)).to.throw(ntype('object', 'a'))
        expect(() => param('object', 'a', str)).to.throw(ntype('object', 'a'))
      })
      it('works with arrays', () => {
        expect(() => param('array', 'a', arr)).to.not.throw()
        expect(() => param('array', 'a', obj)).to.throw(ntype('array', 'a'))
        expect(() => param('array', 'a', bool)).to.throw(ntype('array', 'a'))
        expect(() => param('array', 'a', num)).to.throw(ntype('array', 'a'))
        expect(() => param('array', 'a', str)).to.throw(ntype('array', 'a'))
      })
      it('works with numbers', () => {
        expect(() => param('number', 'a', num)).to.not.throw()
        expect(() => param('number', 'a', arr)).to.throw(ntype('number', 'a'))
        expect(() => param('number', 'a', obj)).to.throw(ntype('number', 'a'))
        expect(() => param('number', 'a', bool)).to.throw(ntype('number', 'a'))
        expect(() => param('number', 'a', str)).to.throw(ntype('number', 'a'))
      })
      it('works with strings', () => {
        expect(() => param('string', 'a', str)).to.not.throw()
        expect(() => param('string', 'a', arr)).to.throw(ntype('string', 'a'))
        expect(() => param('string', 'a', obj)).to.throw(ntype('string', 'a'))
        expect(() => param('string', 'a', bool)).to.throw(ntype('string', 'a'))
        expect(() => param('string', 'a', num)).to.throw(ntype('string', 'a'))
      })
    })
    describe('getDepTree', () => {
      describe('params', () => {
        checkParam('string', 'entry', getDepTree)([num])
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
        checkParam('string', 'file', loadHtmlCompiler)([num])
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

    it('installs elm deps into /elm-stuff', done => {
      const tmpDir = tmp.dirSync({ dir, unsafeCleanup: true })

      init({ dir: tmpDir.name }).then(() => {
        installPackages(tmpDir.name)
          .then(() => {
            expect(path.join(dir, 'elm-stuff')).to.be.a.directory()
            tmpDir.removeCallback()
            done()
          })
          .catch(() => {
            tmpDir.removeCallback()
            done()
          })

        installPackages().catch(() => {
          tmpDir.removeCallback()
          done()
        })
      })
    })
  })

  describe('startReactor', () => {
    describe('params', () => {
      checkParam('string', 'host', startReactor)([num])
      checkParam('number', 'port', startReactor)([str, str])
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
      checkParam('string', 'host', startBrowserSync)([num])
      checkParam('number', 'port', startBrowserSync)([str, str])
      checkParam('string', 'reactor', startBrowserSync)([str, num, num])
      checkParam('string', 'html', startBrowserSync)([str, num, str, num])
      checkParam('string', 'dir', startBrowserSync)([str, num, str, str, num])
    })

    it('starts a browsersync server', () => {
      return expect(
        startBrowserSync(
          defaults.host,
          defaults.port,
          str,
          str,
          str,
          'silent'
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
        str,
        str,
        tmpDir.name
      ).then(({ bs, port }) =>
        request(
          `http://${defaults.host}:${port}/public/${basename}`
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
        str,
        './index.ejs',
        str
      ).then(({ bs, port }) =>
        request(`http://${defaults.host}:${port}/src/Main.elm`)
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
              str,
              str
            ).then(({ bs, port }) =>
              Promise.all([
                request(`http://${defaults.host}:${port}`),
                request(
                  `http://${defaults.host}:${port}/_compile/src/Main.elm`
                ),
              ]).then(([res1, res2]) => {
                assertIncludes('<script src="/_reactor/index.js">', res1)
                assertIncludes('var runElmProgram = ', res2)
                reactor.close()
                bs.exit()
                done()
              })
            )
          )
        )
        .catch(done)
    })

    it.only('creates additional custom proxies', function(done) {
      this.timeout(60000)

      findFreePort(defaults.reactorHost, defaults.reactorPort)
        .then(({ host: reactorHost, port: reactorPort, url: reactorUrl }) =>
          startReactor(reactorHost, reactorPort, false).then(reactor =>
            startBrowserSync(defaults.host, defaults.port, str, str, str, [
              `/p1=${reactorUrl}/`,
              `/p2=${reactorUrl}/src`,
            ]).then(({ bs, port }) =>
              Promise.all([
                request(`http://${defaults.host}:${port}/p1/`),
                request(`http://${defaults.host}:${port}/p2/Main.elm`),
              ]).then(([res1, res2]) => {
                assertIncludes('<script src="/_reactor/index.js">', res1)
                assertIncludes('runElmProgram()', res2)
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

  describe('watching', () => {
    let bs
    let spyWatch
    let spyOn
    let spyClose

    beforeEach(() => {
      spyOn = sinon.spy()
      spyClose = sinon.spy()
      spyWatch = sinon.spy(() => ({ on: spyOn, close: spyClose }))
      bs = { watch: spyWatch }
    })

    describe('createWatcher', () => {
      describe('params', () => {
        checkParam('function', 'onChange', createWatcher)([str])
        checkParam('function', 'onDeps', createWatcher)([fn, str])
        checkParam('function', 'filter', createWatcher)([fn, fn, str])
        checkParam('object', 'bs', createWatcher)([fn, fn, fn, str])
        checkParam('string', 'entry', createWatcher)([fn, fn, fn, obj, num])
      })

      it('returns a promise', () => {
        expect(createWatcher(fn, fn, fn, bs, str).catch(() => {})).to.be.a(
          'promise'
        )
      })
      it('fails on bad entry', () => {
        return expect(createWatcher(fn, fn, fn, bs, str)).to.eventually.be
          .rejected
      })
      it('resolves on valid entry', () => {
        return expect(createWatcher(fn, fn, fn, bs, defaults.main))
          .to.eventually.be.an('object')
          .with.property('close')
      })
      it('resolves on valid entry', () => {
        return expect(createWatcher(fn, fn, fn, bs, defaults.stylesheets))
          .to.eventually.be.an('object')
          .with.property('close')
      })
      it('bs.watch is called', done => {
        createWatcher(fn, fn, fn, bs, defaults.main).then(() => {
          expect(spyWatch.called).to.eql(true)
          done()
        })
      })
      it('watcher.on is called', done => {
        createWatcher(fn, fn, fn, bs, defaults.main).then(() => {
          expect(spyOn.called).to.eql(true)
          done()
        })
      })
    })

    describe('watch', () => {
      describe('params', () => {
        checkParam('object', 'bs', watch)([str])
        checkParam('string', 'main', watch)([obj, num])
        checkParam('string', 'stylesheets', watch)([obj, str, num])
        checkParam('string', 'dir', watch)([obj, str, str, num])
      })

      it('returns a promise', () => {
        expect(watch({}, str, str, str).catch(() => {})).to.be.a('promise')
      })
      it('rejects invalid entry paths', () => {
        return expect(watch({}, str, str, str)).to.eventually.be.rejected
      })
      it('resolves valid entry paths with two watchers', () => {
        const promise = watch(bs, defaults.main, defaults.stylesheets, str)

        return Promise.all([
          promise.should.eventually.be.fulfilled,
          promise.should.eventually.have.a.nested.property('[0].close'),
          promise.should.eventually.have.a.nested.property('[1].close'),
        ])
      })
    })
  })

  describe('dev', () => {
    let promise

    before(() => {
      promise = dev(defaults)
    })

    it('fails', () => {
      return expect(dev({ reactorPort: 'string' })).to.eventually.be.rejected
    })
    it('resolves', () => {
      expect(promise).to.be.a('promise')
      expect(promise).to.eventually.be.fulfilled
    })
  })
})
