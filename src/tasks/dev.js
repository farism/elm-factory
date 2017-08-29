const anyTemplate = require('gulp-any-template')
const elmCss = require('gulp-elm-css')
const elmFindDependencies = require('gulp-elm-find-dependencies')
const execa = require('execa')
const express = require('express')
const fkill = require('fkill')
const gulp = require('gulp')
const lrConnect = require('connect-livereload')
const nocache = require('nocache')
const path = require('path')
const plumber = require('gulp-plumber')
const proxy = require('http-proxy-middleware')
const runSequence = require('run-sequence')
const tinylr = require('tiny-lr')
const through = require('through2')
const tmp = require('tmp')

const defaults = require('../defaults').dev
const addTask = require('./').addTask

let htmlCompiler

const defaultHtmlCompiler = () => Promise.resolve('html is compiling...')

const getWatchedPaths = ({ _watcher }) =>
  Object.keys(_watcher.watched())
    .reduce((acc, key) => [...acc, ..._watcher.watched()[key]], [])
    .sort()

const startReactor = (
  host,
  port,
  /* istanbul ignore next */ exitParent = true
) =>
  new Promise((resolve, reject) => {
    const reactor = execa(
      'elm-reactor',
      [`--address=${host}`, `--port=${port}`],
      { detached: true }
    )

    const close = () => {
      fkill(-reactor.pid, { force: true }).catch(e => {
        console.error('closing elm-reactor failed: ', e)
      })
    }

    const exit = code => {
      close()
      process.exit(code)
    }

    if (exitParent) {
      reactor.on('exit', code => exit(0))
      reactor.on('SIGTERM', () => exit(0))
    }

    process.on('exit', code => exit(code))
    process.on('SIGTERM', () => exit(0))
    process.on('SIGINT', () => exit(0))
    process.on('uncaughtException', e => {
      console.log(e)
      exit(1)
    })

    reactor.stderr.on('data', d => {
      reactor.stderr.on('data', () => {})
      if (d.toString().includes('Address already in use')) {
        reject({ close })
      } else {
        resolve({ close })
      }
    })
  })

const startExpress = (host, port, reactor, lrPort, handler, dir) =>
  new Promise((resolve, reject) => {
    const app = new express()

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

        // serve up elm file with custom html middleware and do livereload
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

const compileHtml = html => {
  if (!html) {
    throw new Error('html required')
  }

  return gulp.src(html).pipe(
    through.obj(function(file, encode, callback) {
      this.push(file)
      htmlCompiler = anyTemplate.compiler(file)
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
  const opts = Object.assign({}, defaults, options)

  // tmp dir for serving static css files
  const { name: tmpDir } = tmp.dirSync({ unsafeCleanup: true })

  // custom html handler
  const handler = (request, response) =>
    (htmlCompiler || defaultHtmlCompiler)({
      environment: 'development',
      options,
      request,
    })
      .then(res => response.send(res))
      .catch(e => console.error(e.message))

  // is there a better way to use gulp.watch and find-elm-dependencies...?
  let htmlWatcher
  let mainWatcher
  let cssWatcher

  gulp.task('_html', () => {
    htmlWatcher && htmlWatcher.end()
    htmlWatcher = gulp.watch(opts.html, ['_html'])

    return compileHtml(opts.html)
  })

  gulp.task('_css', () => {
    cssWatcher && cssWatcher.end()
    cssWatcher = gulp.watch(opts.stylesheets, ['_css'])

    watch()(cssWatcher, opts.stylesheets)

    return compileCss(tmpDir, opts.stylesheets, opts.cwd)
  })

  gulp.task('_main', () => {
    tinylr.changed('')

    mainWatcher && mainWatcher.end()
    mainWatcher = gulp.watch(opts.main, ['_main'])

    const filter = file => !getWatchedPaths(cssWatcher).includes(file.path)

    watch(filter)(mainWatcher, opts.main)
  })

  gulp.task('dev', () => {
    return startReactor(opts.reactorHost, opts.reactorPort)
      .then(reactor =>
        startExpress(
          opts.host,
          opts.port,
          `http://${opts.reactorHost}:${opts.reactorPort}`,
          opts.lrPort,
          handler,
          tmpDir
        )
      )
      .then(app => runSequence('_html', '_css', '_main'))
      .catch(e => {
        console.error(e)
      })
  })

  return gulp
}

module.exports = {
  defaultHtmlCompiler,
  getWatchedPaths,
  startReactor,
  startExpress,
  compileHtml,
  compileCss,
  watch,
  task,
}
