import chai, { assert, expect } from 'chai'
import chaifs from 'chai-fs'
import path from 'path'
import tmp from 'tmp'

import {
  buildCss,
  buildMain,
  getHash,
  getPublicPath,
  getTransformedFilename,
  build,
} from '../../src/tasks/build'
import { init } from '../../src/tasks/init'
import { build as defaults } from '../../src/defaults'
import { checkParam } from './utils-test'

chai.use(chaifs)

describe('BUILD TASK', () => {
  const dir = path.join(__dirname, 'tmp')
  let outputPath = ''
  let tmpCleanup = () => {}

  before(done => {
    init({ dir, force: true }).then(() => {
      process.chdir(dir)
      done()
    })
  })

  beforeEach(() => {
    const { name, removeCallback } = tmp.dirSync({ dir, unsafeCleanup: true })

    outputPath = name
    tmpCleanup = removeCallback
  })

  afterEach(() => {
    tmpCleanup()
  })

  describe('buildCss', function() {
    this.timeout(6000000)

    describe('params', () => {
      checkParam('string', 'stylesheets', buildCss)([1])
      checkParam('string', 'outputPath', buildCss)([' ', 1])
      checkParam('string', 'publicPath', buildCss)([' ', ' ', 1])
      checkParam('boolean', 'minify', buildCss, false)([' ', ' ', ' ', ' '])
      checkParam('string', 'cwd', buildCss, false)([' ', ' ', ' ', true, 1])
    })

    it('builds into the correct outputPath', done => {
      buildCss(
        defaults.stylesheets,
        outputPath,
        defaults.publicPath,
        false,
        dir
      ).then(() => {
        expect(outputPath)
          .to.be.a.directory()
          .with.deep.files([
            '8855f72a.css',
            'css-manifest.json',
            'f083965f.png',
          ])

        done()
      })
    })
    it('builds with correct publicPath', done => {
      buildCss(
        defaults.stylesheets,
        outputPath,
        'http://somecdn.com/',
        false
      ).then(() => {
        expect(outputPath)
          .to.be.a.directory()
          .with.deep.files([
            'a9c81025.css',
            'css-manifest.json',
            'f083965f.png',
          ])

        done()
      })
    })
    it('does minification', done => {
      buildCss(
        defaults.stylesheets,
        outputPath,
        defaults.publicPath,
        true
      ).then(() => {
        expect(outputPath)
          .to.be.a.directory()
          .with.deep.files([
            'css-manifest.json',
            'eaa60ed2.css',
            'f083965f.png',
          ])

        done()
      })
    })
    it('generates a valid css-manifest.json', done => {
      buildCss(
        defaults.stylesheets,
        outputPath,
        defaults.publicPath,
        false
      ).then(() => {
        expect(`${outputPath}/css-manifest.json`)
          .to.be.a.file()
          .with.contents('{\n  "index.css": "8855f72a.css"\n}')

        done()
      })
    })
  })

  describe('buildMain', function() {
    this.timeout(6000000)

    describe('params', () => {
      checkParam('string', 'main', buildMain)([1])
      checkParam('string', 'outputPath', buildMain)([' ', 1])
      checkParam('string', 'publicPath', buildMain)([' ', ' ', 1])
      checkParam('boolean', 'minify', buildMain, false)([' ', ' ', ' ', ' '])
      checkParam('string', 'cwd', buildMain, false)([' ', ' ', ' ', true, 1])
    })

    it('builds into the correct outputPath', done => {
      buildMain(
        defaults.main,
        outputPath,
        defaults.publicPath,
        false,
        dir
      ).then(() => {
        expect(outputPath)
          .to.be.a.directory()
          .with.deep.files(['d50146ff.js', 'f083965f.png', 'js-manifest.json'])

        done()
      })
    })
    it('builds with correct publicPath', done => {
      buildMain(
        defaults.main,
        outputPath,
        'http://somecdn.com/',
        false
      ).then(() => {
        expect(outputPath)
          .to.be.a.directory()
          .with.deep.files(['d50146ff.js', 'f083965f.png', 'js-manifest.json'])

        done()
      })
    })
    it('does minification', done => {
      buildMain(
        defaults.main,
        outputPath,
        defaults.publicPath,
        true
      ).then(() => {
        expect(outputPath)
          .to.be.a.directory()
          .with.deep.files(['js-manifest.json', 'd50146ff.js', 'f083965f.png'])

        done()
      })
    })
    it('generates a valid js-manifest.json', done => {
      buildMain(
        defaults.main,
        outputPath,
        defaults.publicPath,
        false
      ).then(() => {
        expect(`${outputPath}/js-manifest.json`)
          .to.be.a.file()
          .with.contents('{\n  "Main.js": "d50146ff.js"\n}')

        done()
      })
    })
  })

  describe('build', () => {
    let promise

    before(() => {
      promise = build(defaults)
    })

    it('returns a promise', () => {
      expect(promise).to.be.a('promise')
    })

    it('should resolve', function() {
      this.timeout(60000)

      return expect(promise).to.eventually.be.fulfilled
    })
  })
})
