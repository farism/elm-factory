const anyTemplate = require('gulp-any-template')
const browserSync = require('browser-sync')
const elmCss = require('elm-css')
const elmFindDependencies = require('gulp-elm-find-dependencies')
const execa = require('execa')
const findAllDependencies = require('find-elm-dependencies').findAllDependencies
const fkill = require('fkill')
const fs = require('fs')
const gulp = require('gulp')
const nocache = require('nocache')
const path = require('path')
const plumber = require('gulp-plumber')
const proxy = require('http-proxy-middleware')
const runSequence = require('run-sequence')
const through = require('through2')
const tmp = require('tmp')
const url = require('url')

const defaults = require('../defaults').dev
const addTask = require('./').addTask

const getDepTree = entry =>
  findAllDependencies(entry).then(deps => [entry, ...deps])

const defaultHtmlCompiler = () =>
  Promise.resolve('incompatible html template...')

const loadHtmlCompiler = file =>
  new Promise((resolve, reject) => {
    fs.readFile(file, (err, contents) => {
      resolve(
        anyTemplate.compiler({ path: file, contents }) || defaultHtmlCompiler
      )
    })
  })

const writeResponse = response => content => {
  response.write(content)
  response.end()
}

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
      console.error(e)
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

const startBrowserSync = (host, port, reactor, html, dir) =>
  new Promise((resolve, reject) => {
    const config = {
      files: [html, `${dir}/*.css`],
      host,
      localOnly: true,
      notify: false,
      online: false,
      open: false,
      port,
      server: {
        baseDir: dir,
        middleware: [
          nocache(),
          proxy('/_compile', { target: reactor }),
          (request, response, next) => {
            if (path.extname(request.url) === '.elm') {
              loadHtmlCompiler(html)
                .then(compiler =>
                  compiler({
                    environment: 'development',
                    request,
                  })
                )
                .then(writeResponse(response))
                .catch(writeResponse(response))
            } else {
              next()
            }
          },
          proxy('/', { target: reactor }),
        ],
      },
      serveStatic: [
        {
          route: '/public',
          dir,
        },
      ],
    }

    const server = browserSync.create()

    server.init(config, () => resolve(server))
  })

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
    .pipe(plumber.stop())
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
  const tmpDir = tmp.dirSync({ unsafeCleanup: true })

  gulp.task('_css', () => compileCss(tmpDir.name, opts.stylesheets, opts.cwd))

  gulp.task('_main', () => {
    // browsersync && browsersync.refresh()
    mainWatcher && mainWatcher.end()
    mainWatcher = gulp.watch(opts.main, ['_main'])

    const filter = file => !getWatchedPaths(cssWatcher).includes(file.path)

    return watch(filter)(mainWatcher, opts.main)
  })

  gulp.task('dev', () => {
    return startReactor(opts.reactorHost, opts.reactorPort)
      .then(() => {
        return startBrowserSync(
          opts.host,
          opts.port,
          `http://${opts.reactorHost}:${opts.reactorPort}`,
          opts.html,
          tmpDir.name
        ).then(bs => {
          let stylesheetsDeps

          getDepTree(opts.stylesheets)
            .then(_stylesheetDeps => {
              stylesheetsDeps = _stylesheetDeps

              return getDepTree(opts.main).then(_mainDeps => {
                console.log(_mainDeps)
              })
            })
            .then()
        })
      })
      .catch(e => {
        console.error(e)
      })
  })

  return gulp
}

module.exports = {
  defaultHtmlCompiler,
  startReactor,
  startBrowserSync,
  compileCss,
  watch,
  task,
}
