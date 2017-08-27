const anyTemplate = require('gulp-any-template')
const elmCss = require('gulp-elm-css')
const elmFindDependencies = require('gulp-elm-find-dependencies')
const express = require('express')
const gulp = require('gulp')
const hookStd = require('hook-std')
const lr = require('gulp-livereload')
const lrConnect = require('connect-livereload')
const nocache = require('nocache')
const path = require('path')
const proxy = require('http-proxy-middleware')
const pump = require('pump')
const spawn = require('cross-spawn')
const runSequence = require('run-sequence')
const through = require('through2')
const tmp = require('tmp')

const defaults = require('../defaults').dev

// is there a better way to link the _express and _template tasks...?
let templateCompiler = () => Promise.resolve('template is compiling...')

const getWatchedFiles = ({ _watcher: { _watched = {} } = {} } = {}) =>
  Object.keys(_watched).reduce(
    (acc, key) => [...acc, ...(_watched[key] || [])],
    []
  )

const startReactor = (host, port, callback) =>
  new Promise((resolve, reject) => {
    const unhook = hookStd.stderr({ silent: false }, output => {
      unhook()
      if (output.includes('Address already in use')) {
        reject('elm-reactor could not start: address already in use')

        return ''
      } else {
        // because elm-reactor is running in detached mode, make sure it's killed
        const exit = code => () => {
          process.kill(-reactor.pid)
          process.exit(code)
        }
        process.on('exit', exit(0))
        process.on('uncaughtException', exit(1))
        process.on('SIGINT', exit(0))
        process.on('SIGTERM', exit(0))

        resolve(reactor)

        return `elm-reactor started on http://${host}:${port}\n`
      }
    })

    const reactor = spawn(
      'elm-reactor',
      [`--address=${host}`, `--port=${port}`],
      { detached: true }
    )

    reactor.stderr.pipe(process.stderr)
    reactor.unref()
  })

const startExpress = (dir, host, port, reactor, lrPort, handler) =>
  new Promise((resolve, reject) => {
    const app = new express()
      // add no cache headers
      .use(nocache())
      // serve static assets
      .use('/public', express.static(dir))
      // proxy _compile to {reactor}/_compile and do livereload
      .use('/_compile', [
        lrConnect({ port: lrPort }),
        proxy({ target: reactor }),
      ])
      // serve up elm file with custom template middleware and do livereload
      .get('*.elm', [
        lrConnect({ port: lrPort, include: [/.*\.elm/] }),
        handler,
      ])
      // proxy all other requests to elm-reactor
      .use(proxy({ target: reactor }))
      // begin the dev server
      .listen(port, host, err => {
        // begin the livereload server
        lr.listen({ port: lrPort })
        resolve(app)
      })
  })

const compileTemplate = template =>
  pump(
    gulp.src(template),
    through.obj(function(file, encode, callback) {
      templateCompiler = anyTemplate.compiler(file)
      this.push(file)
      callback()
    }),
    lr()
  )

const watchCss = (cssWatcher, stylesheets) =>
  pump(
    gulp.src(stylesheets),
    elmFindDependencies(),
    through.obj(function(file, encode, callback) {
      cssWatcher._watcher.add(file.path)
      callback()
    })
  )

const compileCss = (out, stylesheets) =>
  pump(gulp.src(stylesheets), elmCss({ out }), lr())

const watchMain = (cssWatchedFiles, mainWatcher, main) =>
  pump(
    gulp.src(main),
    elmFindDependencies(),
    through.obj((file, encode, callback) => {
      // don't watch css injection files
      if (!cssWatchedFiles.includes(file.path)) {
        mainWatcher._watcher.add(file.path)
      }

      callback()
    })
  )

const task = options => {
  const { name: tmpDir } = tmp.dirSync({ unsafeCleanup: true })
  const {
    main = defaults.main,
    stylesheets = defaults.stylesheets,
    template = defaults.template,
    host = defaults.host,
    port = defaults.port,
    reactorHost = defaults.reactorHost,
    reactorPort = defaults.reactorPort,
    lrServer = defaults.lrServer,
    lrPort = defaults.lrPort,
  } = options

  // is there a better way to use gulp.watch and find-elm-dependencies...?
  let templateWatcher
  let mainWatcher
  let cssWatcher

  gulp.task('_reactor', callback => {
    startReactor(reactorHost, reactorPort, callback)
  })

  gulp.task('_express', callback => {
    startExpress(tmpDir, host, port, reactor, lrPort, expressHandler, callback)
  })

  gulp.task('_template', () => {
    templateWatcher && templateWatcher.end()
    templateWatcher = gulp.watch(template, ['_template'])

    return compileTemplate(template)
  })

  gulp.task('_css', () => {
    cssWatcher && cssWatcher.end()
    cssWatcher = gulp.watch(stylesheets, ['_css'])

    watchCss(cssWatcher, stylesheets)

    return compileCss(tmpDir, stylesheets)
  })

  gulp.task('_main', () => {
    mainWatcher && mainWatcher.end()
    mainWatcher = gulp.watch(main, ['_main'])

    // hard reload
    lr.reload()

    return watchMain(getWatchedFiles(cssWatcher), mainWatcher, main)
  })

  gulp.task('dev', () => {
    return startReactor(reactorHost, reactorPort)
      .then(reactor => {
        const handler = (request, response) => {
          templateCompiler({
            environment: 'development',
            lrServer,
            options,
            request,
          })
            .then(res => response.send(res))
            .catch(e => console.error(e.message))
        }

        return startExpress(
          tmpDir,
          host,
          port,
          `http://${reactorHost}:${reactorPort}`,
          lrPort,
          handler
        )
      })
      .then(app => runSequence('_template', '_css', '_main'))
      .catch(e => console.error(e))
  })
}

module.exports = {
  getWatchedFiles,
  startReactor,
  startExpress,
  compileTemplate,
  watchCss,
  compileCss,
  watchMain,
  task,
}
