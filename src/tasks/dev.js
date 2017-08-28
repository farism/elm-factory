const anyTemplate = require('gulp-any-template')
const devnull = require('dev-null')
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

const startReactor = (host, port) =>
  new Promise((resolve, reject) => {
    const unhook = hookStd.stderr({ silent: false }, output => {
      unhook()
      reactor.stderr.pipe(devnull())
      if (
        output.includes('Error') ||
        output.includes('Address already in use')
      ) {
        reject('elm-reactor could not start: address already in use')

        return ''
      } else {
        // because elm-reactor is running in detached mode, make sure it's killed
        const exit = code => () => {
          try {
            process.kill(-reactor.pid) // use ESRCH
          } catch (e) {}
          process.exit(code)
        }
        process.on('uncaughtException', exit(1))
        process.on('exit', exit(0))
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

const startExpress = (host, port, reactor, lrPort, handler, dir) =>
  new Promise((resolve, reject) => {
    const app = new express()

    // begin the dev server
    const server = app
      .listen(port, host, err => {
        if (err) {
          reject(err)
          return
        }

        // add no cache headers
        app.use(nocache())

        if (reactor) {
          // proxy _compile to {reactor}/_compile and do livereload
          app.use(
            '/_compile',
            [
              lrPort && lrConnect({ port: lrPort }),
              proxy({ target: reactor }),
            ].filter(m => m)
          )
        }

        // serve up elm file with custom template middleware and do livereload
        if (handler) {
          app.get('*.elm', [
            lrConnect({ port: lrPort, include: [/.*\.elm/] }),
            handler,
          ])
        }

        // serve /public static assets from the tmp dir
        if (dir) {
          app.use('/public', express.static(dir))
        }

        if (reactor) {
          // proxy all other requests to elm-reactor
          app.use(proxy({ target: reactor }))
        }

        // begin the livereload server
        if (lrPort) {
          lr.listen({ port: lrPort })
        }

        resolve(server)
      })
      .on('error', e => {
        reject(e)
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

const compileCss = (out, stylesheets) =>
  pump(gulp.src(stylesheets), elmCss({ out }), lr())

const watchCss = (cssWatcher, stylesheets) =>
  pump(
    gulp.src(stylesheets),
    elmFindDependencies(),
    through.obj((file, encode, callback) => {
      cssWatcher._watcher.add(file.path)
      callback()
    })
  )

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

  const { name: tmpDir } = tmp.dirSync({ unsafeCleanup: true })

  // is there a better way to use gulp.watch and find-elm-dependencies...?
  let templateWatcher
  let mainWatcher
  let cssWatcher

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
          host,
          port,
          `http://${reactorHost}:${reactorPort}`,
          lrPort,
          tmpDir,
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
