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

const installPackages = () =>
  new Promise((resolve, reject) =>
    execa('elm-package', ['install', '--yes'], { stdio: 'inherit' })
      .then(() => resolve())
      .catch(e => reject(e))
  )

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
      logLevel: 'silent',
      notify: false,
      online: false,
      open: false,
      port,
      server: {
        baseDir: dir,
        middleware: [
          nocache(),
          proxy('/_compile', { target: reactor, logLevel: 'silent' }),
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
          proxy('/', { target: reactor, logLevel: 'silent' }),
        ],
      },
      serveStatic: [
        {
          route: '/public',
          dir,
        },
      ],
    }

    const bs = browserSync.create()

    // bs.emitter.on('init', function() {
    //   console.log('Browsersync is running!')
    // })

    bs.init(config, () => resolve(bs))
  })

const task = options => {
  const opts = Object.assign({}, defaults, options)

  // tmp dir for serving static css files
  const tmpDir = tmp.dirSync({ unsafeCleanup: true })

  // the cli task
  return (
    // first install packages using elm-package
    installPackages()
      // then start reactor
      .then(() => startReactor(opts.reactorHost, opts.reactorPort))
      // then start browser-sync
      .then(() =>
        startBrowserSync(
          opts.host,
          opts.port,
          `http://${opts.reactorHost}:${opts.reactorPort}`,
          opts.html,
          tmpDir.name
        )
      )
      .then(bs =>
        // then we want to build the css (before we start watching)
        elmCss(process.cwd(), opts.stylesheets, tmpDir.name)
          // finally we start watching
          .then(() => {
            let stylesheetsWatcher
            let stylesheetsDeps
            let mainWatcher
            let mainDeps

            const watchCss = () =>
              getDepTree(opts.stylesheets).then(deps => {
                stylesheetsDeps = deps

                return bs.watch(['!elm-stuff', ...deps]).on('change', file => {
                  // stop watching temporarily
                  stylesheetsWatcher && stylesheetsWatcher.close()

                  /// rebuild css
                  elmCss(process.cwd(), opts.stylesheets, tmpDir.name)
                    .then(() =>
                      // start watching files again
                      watchCss().then(watcher => (stylesheetsWatcher = watcher))
                    )
                    .catch(e =>
                      // start watching files again
                      watchCss().then(watcher => (stylesheetsWatcher = watcher))
                    )
                })
              })

            const watchMain = () =>
              getDepTree(opts.main).then(deps => {
                mainDeps = deps

                return bs.watch(['!elm-stuff', ...deps]).on('change', file => {
                  if (!stylesheetsDeps.includes(file)) {
                    // stop watching temporarily
                    mainWatcher && mainWatcher.close()

                    // reload the browser
                    bs.reload()

                    // start watching again
                    watchMain().then(watcher => (mainWatcher = watcher))
                  }
                })
              })

            return watchCss()
              .then(watcher => {
                stylesheetsWatcher = watcher

                return watchMain()
              })
              .then(watcher => {
                mainWatcher = watcher
              })
          })
          .catch(e => {
            console.error(e)
          })
      )
  )
}

module.exports = {
  defaultHtmlCompiler,
  getDepTree,
  writeResponse,
  startReactor,
  startBrowserSync,
  task,
}
