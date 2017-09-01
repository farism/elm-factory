import chai, { assert, expect } from 'chai'
import chaifs from 'chai-fs'
import chaiAsPromised from 'chai-as-promised'
import check from 'check-types'
import fs from 'fs'
import http from 'http'
import gulp from 'gulp'
import path from 'path'
import portscanner from 'portscanner'
import request from 'request-promise-native'
import sinon from 'sinon'
import tmp from 'tmp'

import {
  invalidParam,
  validateParam,
  parseProxies,
  createProxies,
  defaultHtmlCompiler,
  getDepTree,
  loadHtmlCompiler,
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

const checkParam = (type, name, testFn, required = true) => (params = []) => {
  it(`\`${name}\` param is validated`, () => {
    if (required) {
      expect(() => testFn.apply(null, params.slice(0, -1))).to.throw(
        invalidParam(type, name)
      )
    }
    expect(() => testFn.apply(null, params)).to.throw(invalidParam(type, name))
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
    describe('invalidParam', () => {
      it('returns the correct message', () => {
        expect(invalidParam('foo', 'bar')).to.eql(
          'parameter `bar` expected `foo`'
        )
      })
    })
    describe('validateParam', () => {
      it('throws when param is required and missing', () => {
        expect(() => validateParam('string', str)).to.throw(
          invalidParam('string', str)
        )
      })
      it('throws when param is required and provided with invalid type', () => {
        expect(() => validateParam('string', str, 123)).to.throw(
          invalidParam('string', str)
        )
      })
      it('throws when param is not required and provided with invalid type', () => {
        expect(() => validateParam('string', str, 123, false)).to.throw(
          invalidParam('string', str)
        )
      })
      it('does not throw when param is not required and provided with undefined or null', () => {
        expect(() => validateParam('string', str, null, false)).to.not.throw()
      })
    })
    describe('parseProxies', () => {
      describe('params', () => {
        checkParam('array', 'proxies', parseProxies)([str])
        checkParam('array', 'proxies', parseProxies)([str, str])
        it('throws when not passed array of strings', () => {
          expect(() => parseProxies('=', [123])).to.throw()
        })
      })
      it('ignores invalid delimiter', () => {
        expect(parseProxies('=', ['foo:bar', 'foo bar'])).to.have.length.of(0)
      })
      it('returns array of objects with from/target keys', () => {
        const proxies = parseProxies('=', ['foo=bar', 'ping=pong'])

        expect(proxies).to.have.length.of(2)
        expect(proxies[0]).to.have.a.property('from', 'foo')
        expect(proxies[0]).to.have.a.property('target', 'bar')
        expect(proxies[1]).to.have.a.property('from', 'ping')
        expect(proxies[1]).to.have.a.property('target', 'pong')
      })
    })
    describe('createProxies', () => {
      describe('params', () => {
        checkParam('array', 'proxies', parseProxies)()
        checkParam('array', 'proxies', parseProxies)([str])
      })
      it('returns an array of http-proxy-middlewares', () => {
        const proxies = parseProxies('=', ['foo=bar', 'ping=pong'])
        const middlewares = createProxies(bool, proxies)

        expect(middlewares).to.have.length(2)
        expect(middlewares)
          .to.have.a.property('1')
          .that.is.a('function')
      })
    })
    describe('getDepTree', () => {
      describe('params', () => {
        checkParam('string', 'entry', getDepTree)()
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
      checkParam('array', 'proxies', startBrowserSync, false)([
        str,
        num,
        str,
        str,
        str,
        str,
      ])
    })

    it('starts a browsersync server', () => {
      return expect(
        startBrowserSync(
          defaults.host,
          defaults.port,
          str,
          str,
          str
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

    describe('custom proxies', () => {
      let reactor
      let reactorUrl

      before(done => {
        findFreePort(
          defaults.reactorHost,
          defaults.reactorPort
        ).then(({ host, port, url }) =>
          startReactor(host, port, false).then(_reactor => {
            reactorUrl = url
            reactor = _reactor
            done()
          })
        )
      })

      after(() => {
        reactor.close()
      })

      it('creates custom proxies with path rewriting', done => {
        startBrowserSync(
          defaults.host,
          defaults.port,
          str,
          str,
          str,
          [`/p1=${reactorUrl}/`, `/p2=${reactorUrl}/src`],
          true
        )
          .then(({ bs, port }) =>
            Promise.all([
              request(`http://${defaults.host}:${port}/p1/`),
              request(`http://${defaults.host}:${port}/p2/Main.elm`),
            ]).then(([res1, res2]) => {
              assertIncludes('<script src="/_reactor/index.js">', res1)
              assertIncludes('runElmProgram()', res2)
              bs.exit()
              done()
            })
          )
          .catch(done)
      })

      it('does not rewrite paths', () => {
        return expect(
          startBrowserSync(
            defaults.host,
            defaults.port,
            str,
            str,
            str,
            [`/p1=${reactorUrl}/src`],
            false
          ).then(({ bs, port }) =>
            request(`http://${defaults.host}:${port}/p1/Main.elm`)
          )
        ).to.eventually.be.rejected
      })
    })
  })

  describe('watch mode', () => {
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
