import chai, { assert, expect } from 'chai'
import chaifs from 'chai-fs'
import chaiAsPromised from 'chai-as-promised'
import fs from 'fs'
import http from 'http'
import path from 'path'
import portscanner from 'portscanner'
import request from 'request-promise-native'
import sinon from 'sinon'
import tmp from 'tmp'

import {
  parseProxies,
  createProxies,
  getDepTree,
  loadHtmlCompiler,
  startReactor,
  startBrowserSync,
  createWatcher,
  dev,
} from '../../src/tasks/dev'
import { invalidParam } from '../../src/tasks/utils'
import { init } from '../../src/tasks/init'
import { dev as defaults } from '../../src/defaults'
import { checkParam } from './utils-test'

chai.should()
chai.use(chaifs)
chai.use(chaiAsPromised)
tmp.setGracefulCleanup()

const dir = path.join(__dirname, 'tmp')

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

describe.only('DEV TASK', function() {
  before(done => {
    init({ dir, force: true }).then(() => {
      process.chdir(dir)
      done()
    })
  })

  describe('helpers', () => {
    describe('parseProxies', () => {
      describe('params', () => {
        checkParam('array', 'proxies', parseProxies)([' '])
        checkParam('array', 'proxies', parseProxies)([' ', ' '])
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
        checkParam('array', 'proxies', parseProxies)([' '])
      })
      it('returns an array of http-proxy-middlewares', () => {
        const proxies = parseProxies('=', ['foo=bar', 'ping=pong'])
        const middlewares = createProxies(true, proxies)

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
        checkParam('string', 'file', loadHtmlCompiler)([1])
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
  })

  describe('startReactor', () => {
    describe('params', () => {
      checkParam('string', 'host', startReactor)([1])
      checkParam('number', 'port', startReactor)([' ', ' '])
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
      checkParam('string', 'host', startBrowserSync)([1])
      checkParam('number', 'port', startBrowserSync)([' ', ' '])
      checkParam('string', 'reactor', startBrowserSync)([' ', 1, 1])
      checkParam('string', 'html', startBrowserSync)([' ', 1, ' ', 1])
      checkParam('string', 'dir', startBrowserSync)([' ', 1, ' ', ' ', 1])
      checkParam('array', 'proxies', startBrowserSync, false)([
        ' ',
        1,
        ' ',
        ' ',
        ' ',
        ' ',
      ])
    })

    it('starts a browsersync server', () => {
      return expect(
        startBrowserSync(
          defaults.host,
          defaults.port,
          ' ',
          ' ',
          ' '
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
        ' ',
        ' ',
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
        ' ',
        './index.ejs',
        ' '
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
              ' ',
              ' '
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
          ' ',
          ' ',
          ' ',
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
            ' ',
            ' ',
            ' ',
            [`/p1=${reactorUrl}/src`],
            false
          ).then(({ bs, port }) =>
            request(`http://${defaults.host}:${port}/p1/Main.elm`)
          )
        ).to.eventually.be.rejected
      })
    })
  })

  describe('createWatcher', () => {
    const fn = () => {}
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

    describe('params', () => {
      checkParam('function', 'onChange', createWatcher)([' '])
      checkParam('function', 'onDeps', createWatcher)([fn, ' '])
      checkParam('function', 'filter', createWatcher)([fn, fn, ' '])
      checkParam('object', 'bs', createWatcher)([fn, fn, fn, ' '])
      checkParam('string', 'entry', createWatcher)([fn, fn, fn, {}, 1])
    })

    it('returns a promise', () => {
      expect(createWatcher(fn, fn, fn, bs, ' ').catch(() => {})).to.be.a(
        'promise'
      )
    })
    it('fails on bad entry', () => {
      return expect(createWatcher(fn, fn, fn, bs, ' ')).to.eventually.be
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
