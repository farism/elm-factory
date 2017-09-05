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
  let cleanup = () => {}

  before(done => {
    init({ dir, force: true }).then(() => {
      process.chdir(dir)
      done()
    })
  })

  beforeEach(() => {
    const { name, removeCallback } = tmp.dirSync({
      dir,
      keep: true,
      unsafeCleanup: true,
    })

    outputPath = name
    cleanup = removeCallback
  })

  afterEach(() => {
    // cleanup()
  })

  describe('buildCss', function() {
    this.timeout(60000)

    describe('params', () => {
      checkParam('string', 'stylesheets', buildCss)([1])
      checkParam('string', 'outputPath', buildCss)([' ', 1])
      checkParam('string', 'publicPath', buildCss)([' ', ' ', 1])
      checkParam('boolean', 'minify', buildCss, false)([' ', ' ', ' ', ' '])
      checkParam('string', 'cwd', buildCss, false)([' ', ' ', ' ', true, 1])
    })

    it('builds into the correct outputPath', done => {
      buildCss(defaults.stylesheets, outputPath, '', false)
        .then(() => {
          expect(outputPath)
            .to.be.a.directory()
            .with.deep.files([
              'css-manifest.json',
              'css3.f083965f.png',
              'index.835d2cf5.css',
            ])

          done()
        })
        .catch(done)
    })
    it('builds with correct publicPath', done => {
      buildCss(defaults.stylesheets, outputPath, 'http://somecdn.com/', false)
        .then(() => {
          expect(`${outputPath}/index.72a08c21.css`)
            .to.be.a.file()
            .with.contents.that.match(
              /http:\/\/somecdn.com\/css3.f083965f\.png/
            )

          done()
        })
        .catch(done)
    })
    it('does minification', done => {
      buildCss(defaults.stylesheets, outputPath, defaults.publicPath, true)
        .then(() => {
          expect(`${outputPath}/index.af77fceb.css`)
            .to.be.a.file()
            .and.not.have.contents('\n')

          done()
        })
        .catch(done)
    })
    it('generates a valid css-manifest.json', done => {
      buildCss(defaults.stylesheets, outputPath, defaults.publicPath, false)
        .then(() => {
          expect(`${outputPath}/css-manifest.json`)
            .to.be.a.file()
            .with.contents('{\n  "index.css": "index.835d2cf5.css"\n}\n')

          done()
        })
        .catch(done)
    })
  })

  describe('buildMain', function() {
    this.timeout(60000)

    describe('params', () => {
      checkParam('string', 'main', buildMain)([1])
      checkParam('string', 'outputPath', buildMain)([' ', 1])
      checkParam('string', 'publicPath', buildMain)([' ', ' ', 1])
      checkParam('boolean', 'minify', buildMain, false)([' ', ' ', ' ', ' '])
      checkParam('string', 'cwd', buildMain, false)([' ', ' ', ' ', true, 1])
    })

    it.only('builds into the correct outputPath', done => {
      buildMain(
        defaults.main,
        outputPath,
        defaults.publicPath,
        defaults.assetTag,
        false,
        dir
      )
        .then(() => {
          expect(outputPath)
            .to.be.a.directory()
            .with.deep.files([
              'd50146ff.js',
              'f083965f.png',
              'js-manifest.json',
            ])

          done()
        })
        .catch(done)
    })
    it('does no extract if assetTag is invalid', done => {
      buildMain(
        defaults.main,
        outputPath,
        defaults.publicPath,
        'invalid',
        false,
        dir
      )
        .then(() => {
          expect(outputPath)
            .to.be.a.directory()
            .with.deep.files([
              'd50146ff.js',
              'f083965f.png',
              'js-manifest.json',
            ])

          done()
        })
        .catch(done)
    })
    it('builds with correct publicPath', done => {
      buildMain(
        defaults.main,
        outputPath,
        'http://somecdn.com/',
        defaults.assetTag,
        false
      )
        .then(() => {
          expect(outputPath)
            .to.be.a.directory()
            .with.deep.files([
              'd50146ff.js',
              'f083965f.png',
              'js-manifest.json',
            ])

          done()
        })
        .catch(done)
    })
    it('does minification', done => {
      buildMain(
        defaults.main,
        outputPath,
        defaults.publicPath,
        defaults.assetTag,
        true
      )
        .then(() => {
          expect(outputPath)
            .to.be.a.directory()
            .with.deep.files([
              'js-manifest.json',
              'd50146ff.js',
              'f083965f.png',
            ])

          done()
        })
        .catch(done)
    })
    it('generates a valid js-manifest.json', done => {
      buildMain(
        defaults.main,
        outputPath,
        defaults.publicPath,
        defaults.assetTag,
        false
      )
        .then(() => {
          expect(`${outputPath}/js-manifest.json`)
            .to.be.a.file()
            .with.contents('{\n  "Main.js": "d50146ff.js"\n}')

          done()
        })
        .catch(done)
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
