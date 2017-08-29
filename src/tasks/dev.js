const anyTemplate = require('gulp-any-template')
const elmCss = require('gulp-elm-css')
const elmFindDependencies = require('gulp-elm-find-dependencies')
const eos = require('end-of-stream')
const express = require('express')
const gulp = require('gulp')
const hookStd = require('hook-std')
const lrConnect = require('connect-livereload')
const nocache = require('nocache')
const path = require('path')
const plumber = require('gulp-plumber')
const proxy = require('http-proxy-middleware')
const spawn = require('cross-spawn')
const runSequence = require('run-sequence')
const tinylr = require('tiny-lr')
const through = require('through2')
const tmp = require('tmp')

const defaults = require('../defaults').dev
const addTask = require('./').addTask

let templateCompiler

const defaultTemplateCompiler = () =>
  Promise.resolve('template is compiling...')

const getWatchedPaths = ({ _watcher }) =>
  Object.keys(_watcher.watched())
    .reduce((acc, key) => [...acc, ..._watcher.watched()[key]], [])
    .sort()

const startReactor = (host, port) =>
  new Promise((resolve, reject) => {
    const unhook = hookStd.stderr({ silent: false }, output => {
      unhook()

      /* istanbul ignore if  */
      if (output.includes('Error')) {
        reject('elm-reactor could not start:', output)
        return
      }

      if (output.includes('Address already in use')) {
        reject('elm-reactor could not start: address already in use')
        return
      }

      // elm-reactor is running in detached mode, so make sure it's killed
      const exit = code => () => {
        try {
          process.kill(-reactor.pid) // use ESRCH
        } catch (e) {
          console.error(e)
        }
        process.exit(code)
      }
      process.on(
        'uncaughtException',
        /* istanbul ignore next  */ e => {
          console.error(e)
          exit(1)()
        }
      )
      process.on('exit', exit(0))
      process.on('SIGINT', exit(0))
      process.on('SIGTERM', exit(0))

      resolve(reactor)

      return `elm-reactor started on http://${host}:${port}\n`
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
      .listen(port, host, () => {
        // use no cache headers
        app.use(nocache())

        // use tinylr and start listening
        if (lrPort) {
          tinylr().listen({ port: lrPort })
        }

        if (reactor) {
          // proxy _compile to {reactor}/_compile and do livereload
          app.use('/_compile', [
            lrConnect({ port: lrPort }),
            proxy({ target: reactor }),
          ])
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

        resolve(server)
      })
      .on('error', e => {
        reject(e)
        return
      })
  })

const compileTemplate = template => {
  if (!template) {
    throw new Error('template required')
  }

  return gulp.src(template).pipe(
    through.obj(function(file, encode, callback) {
      this.push(file)
      templateCompiler = anyTemplate.compiler(file)
      tinylr.changed(file.path)
      callback()
    })
  )
}

const compileCss = (out, stylesheets, cwd = process.cwd()) => {
  if (!out) {
    throw new Error('param `out` required')
  }

  if (!stylesheets) {
    throw new Error('param `stylesheets` required')
  }

  return gulp
    .src(stylesheets)
    .pipe(plumber())
    .pipe(elmCss({ cwd, out }))
    .pipe(
      through.obj(function(file, encode, callback) {
        tinylr.changed(file.path)
        callback()
      })
    )
    .pipe(plumber.stop())
    .pipe(gulp.dest(''))
    .on('error', () => {})
}

const watch = filter => {
  if (typeof filter !== 'undefined' && typeof filter !== 'function') {
    throw new Error('param `filter` must be a function')
  }

  return (watcher, src) =>
    new Promise((resolve, reject) => {
      if (!watcher) {
        reject(new Error('param `watcher` required'))
        return
      }

      if (!src) {
        reject(new Error('param `src` required'))
        return
      }

      gulp
        .src(src)
        .pipe(elmFindDependencies())
        .pipe(
          through.obj(function(file, encode, callback) {
            const watch = filter ? filter(file) : true

            if (watch) {
              watcher._watcher.add(file.path)
            }

            callback()
          })
        )
        .pipe(gulp.dest(''))
        .on('finish', () => {
          resolve(getWatchedPaths(watcher))
        })
    })
}

const task = options => {
  const {
    main = defaults.main,
    stylesheets = defaults.stylesheets,
    template = defaults.template,
    host = defaults.host,
    port = defaults.port,
    reactorHost = defaults.reactorHost,
    reactorPort = defaults.reactorPort,
    lrPort = defaults.lrPort,
    cwd = process.cwd(),
  } = options

  // tmp dir for serving static css files
  const { name: tmpDir } = tmp.dirSync({ unsafeCleanup: true })

  // custom template handler
  const handler = (request, response) => {
    return (templateCompiler || defaultTemplateCompiler)({
      environment: 'development',
      options,
      request,
    })
      .then(res => response.send(res))
      .catch(e => console.error(e.message))
  }

  // is there a better way to use gulp.watch and find-elm-dependencies...?
  let templateWatcher
  let mainWatcher
  let cssWatcher

  /* istanbul ignore next  */
  gulp.task('_template', () => {
    templateWatcher && templateWatcher.end()
    templateWatcher = gulp.watch(template, ['_template'])

    return compileTemplate(template)
  })

  /* istanbul ignore next  */
  gulp.task('_css', () => {
    templateWatcher && templateWatcher.end()
    templateWatcher = gulp.watch(template, ['_template'])

    watch()(cssWatcher, stylesheets)

    return compileCss(tmpDir, stylesheets)
  })

  /* istanbul ignore next  */
  gulp.task('_main', () => {
    tinylr.changed('')

    templateWatcher && templateWatcher.end()
    templateWatcher = gulp.watch(template, ['_template'])

    const filter = file => !getWatchedPaths(cssWatcher).includes(file.path)

    watch(filter)(mainWatcher, main)
  })

  /* istanbul ignore next  */
  gulp.task('dev', () => {
    return startReactor(reactorHost, reactorPort)
      .then(reactor => {
        return startExpress(
          host,
          port,
          `http://${reactorHost}:${reactorPort}`,
          lrPort,
          handler,
          tmpDir
        )
      })
      .then(app => runSequence('_template', '_css', '_main'))
      .catch(e => console.error(e))
  })

  return gulp
}

module.exports = {
  defaultTemplateCompiler,
  getWatchedPaths,
  startReactor,
  startExpress,
  compileTemplate,
  compileCss,
  watch,
  task,
}
