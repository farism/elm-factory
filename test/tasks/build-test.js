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
  task,
} from '../../src/tasks/build'
import { init } from '../../src/tasks/init'
import { build as defaults } from '../../src/defaults'

chai.use(chaifs)

describe.only('build', () => {
  const dir = path.join(__dirname, 'tmp', 'build')
  let outputPath = ''
  let tmpCleanup = () => {}

  before(done => {
    init(dir).on('end', () => {
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

  describe('task', () => {
    it('adds the tasks to gulp', () => {
      const gulp = task({})
      expect(gulp.tasks).to.have.a.property('_clean')
      expect(gulp.tasks).to.have.a.property('_css')
      expect(gulp.tasks).to.have.a.property('_main')
      expect(gulp.tasks).to.have.a.property('build')
    })
  })

  describe('helpers', () => {
    describe('getHash', () => {
      it('given a buffer, generates an xxh hash', () => {
        expect(getHash(Buffer('elm-factory'))).to.eql('f1526942')
      })
    })
    describe('getPublicPath', () => {
      it('given a publicPath and a filename, generates the correct path', () => {
        expect(getPublicPath('a', 'c.png')).to.eql('/a/c.png')
        expect(getPublicPath('/a/', 'c.png')).to.eql('/a/c.png')
        expect(getPublicPath('a/', '/c.png')).to.eql('/a/c.png')
        expect(getPublicPath('/a', 'b/c.png')).to.eql('/a/c.png')
        expect(getPublicPath('/a/', 'b/c.png')).to.eql('/a/c.png')
        expect(getPublicPath('a/', '/b/c.png')).to.eql('/a/c.png')
        expect(getPublicPath('/a/b', 'b/c/d.png')).to.eql('/a/b/d.png')
        expect(getPublicPath('/a/b', 'b/c/d.png')).to.eql('/a/b/d.png')
        expect(getPublicPath('a/b/', '/b/c/d.png')).to.eql('/a/b/d.png')
        expect(getPublicPath('http://foo.bar/', '/a.png')).to.eql(
          'http://foo.bar/a.png'
        )
        expect(getPublicPath('http://foo.bar/', 'a/b.png')).to.eql(
          'http://foo.bar/b.png'
        )
      })
    })
    describe('getTransformedFilename', () => {
      it('given a vinyl file, generates a hashed filename', () => {
        expect(
          getTransformedFilename({
            path: 'a.png',
            contents: Buffer('a'),
          })
        ).to.eql('550d7456.png')

        expect(
          getTransformedFilename({
            path: 'b.jpg',
            contents: Buffer('b'),
          })
        ).to.eql('a20cadbf.jpg')
      })
    })
  })

  describe('buildCss', function() {
    this.timeout(6000000)

    it('builds into the correct outputPath', done => {
      buildCss(
        defaults.stylesheets,
        outputPath,
        defaults.publicPath,
        false,
        dir
      ).on('end', () => {
        expect(outputPath).to.be.a
          .directory()
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
      ).on('end', () => {
        expect(outputPath).to.be.a
          .directory()
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
      ).on('end', () => {
        expect(outputPath).to.be.a
          .directory()
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
      ).on('end', () => {
        expect(`${outputPath}/css-manifest.json`).to.be.a
          .file()
          .with.contents('{\n  "index.css": "8855f72a.css"\n}')

        done()
      })
    })
  })

  describe('buildMain', function() {
    this.timeout(6000000)

    it('builds into the correct outputPath', done => {
      buildMain(
        defaults.main,
        outputPath,
        defaults.publicPath,
        false
      ).on('end', () => {
        expect(outputPath).to.be.a
          .directory()
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
      ).on('end', () => {
        expect(outputPath).to.be.a
          .directory()
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
      ).on('end', () => {
        expect(outputPath).to.be.a
          .directory()
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
      ).on('end', () => {
        expect(`${outputPath}/js-manifest.json`).to.be.a
          .file()
          .with.contents('{\n  "Main.js": "d50146ff.js"\n}')

        done()
      })
    })
  })
})
