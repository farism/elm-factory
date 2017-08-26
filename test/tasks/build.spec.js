import chai, { assert, expect } from 'chai'
import chaifs from 'chai-fs'
import dirCompare from 'dir-compare'
import path from 'path'
import tmp from 'tmp'

import {
  buildCss,
  buildMain,
  getHash,
  getPublicPath,
  getTransformedFilename,
} from '../../src/tasks/build'
import { init } from '../../src/tasks/init'
import { build as defaults } from '../../src/defaults'

chai.use(chaifs)

describe('build', function() {
  this.timeout(6000000)

  let dir = ''
  let removeCallback = () => {}

  before(function(done) {
    // create a tmp folder
    const tmpDir = tmp.dirSync({ unsafeCleanup: true })

    // get the dir name and cleanup callback
    dir = tmpDir.name
    removeCallback = tmpDir.removeCallback

    // chdir to run builds from tmp project dir
    process.chdir(dir)

    // use the `init` task to create a tmp project
    init('.').on('end', () => done())
  })

  after(function() {
    // cleanup the tmp folder
    removeCallback()
  })

  describe('helpers', () => {
    describe('getHash', () => {
      it('given a buffer, generates an xxh hash', () => {
        expect(getHash(Buffer('ELM-FACTORY'))).to.eql('af2ffec2')
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

  describe('buildCss', () => {
    it('builds into the correct outputPath', done => {
      const outputPath = 'build-css-outputPath'

      buildCss(
        defaults.stylesheets,
        outputPath,
        defaults.publicPath
      ).on('end', () => {
        expect(`${dir}/${outputPath}`).to.be.a
          .directory()
          .with.deep.files([
            'css-manifest.json',
            'eaa60ed2.css',
            'f083965f.png',
          ])

        done()
      })
    })
    it('builds with correct publicPath', done => {
      const outputPath = 'build-css-publicPath'

      buildCss(
        defaults.stylesheets,
        outputPath,
        'http://somecdn.com/'
      ).on('end', () => {
        expect(`${dir}/${outputPath}`).to.be.a
          .directory()
          .with.deep.files([
            'css-manifest.json',
            'a7c2d4f7.css',
            'f083965f.png',
          ])

        done()
      })
    })
    it('generates a valid css-manifest.json', done => {
      const outputPath = 'build-css-manifest'

      buildCss(
        defaults.stylesheets,
        outputPath,
        defaults.publicPath
      ).on('end', () => {
        expect(`${dir}/${outputPath}/css-manifest.json`).to.be.a
          .file()
          .with.contents('{\n  "index.css": "eaa60ed2.css"\n}')

        done()
      })
    })
  })

  describe('buildMain', () => {
    it('builds into the correct outputPath', done => {
      const outputPath = 'build-main-outputPath'

      buildMain(
        defaults.main,
        outputPath,
        defaults.publicPath
      ).on('end', () => {
        expect(`${dir}/${outputPath}`).to.be.a
          .directory()
          .with.deep.files(['d50146ff.js', 'f083965f.png', 'js-manifest.json'])

        done()
      })
    })
    it('builds with correct publicPath', done => {
      const outputPath = 'build-main-publicPath'

      buildMain(
        defaults.main,
        outputPath,
        'http://somecdn.com/'
      ).on('end', () => {
        expect(`${dir}/${outputPath}`).to.be.a
          .directory()
          .with.deep.files(['d50146ff.js', 'f083965f.png', 'js-manifest.json'])

        done()
      })
    })
    it('generates a valid js-manifest.json', done => {
      const outputPath = 'build-main-manifest'

      buildMain(
        defaults.main,
        outputPath,
        defaults.publicPath
      ).on('end', () => {
        expect(`${dir}/${outputPath}/js-manifest.json`).to.be.a
          .file()
          .with.contents('{\n  "Main.js": "d50146ff.js"\n}')

        done()
      })
    })
  })
})
