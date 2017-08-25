const anyTemplate = require('gulp-any-template')
const express = require('express')
const gulp = require('gulp')
const livereload = require('gulp-livereload')
const livereloadConnect = require('connect-livereload')
const path = require('path')
const proxy = require('http-proxy-middleware')
const pump = require('pump')
const spawn = require('cross-spawn')
const runSequence = require('run-sequence')
const through = require('through2')
const tmp = require('tmp')
const elmFindDependencies = require('gulp-elm-find-dependencies')
const elmCss = require('gulp-elm-css')

const defaults = require('../defaults').dev

const dev = options => {
  const { name: tmpDir } = tmp.dirSync()
  const {
    main = defaults.main,
    stylesheets = defaults.stylesheets,
    template = defaults.template,
    host = defaults.host,
    port = defaults.port,
    reactorHost = defaults.reactorHost,
    reactorPort = defaults.reactorPort,
  } = options

  gulp.task('dev-reactor', () => {
    const reactor = spawn(
      'elm-reactor',
      [`--port=${reactorPort}`, `--address=${reactorHost}`],
      { stdio: 'inherit' }
    )
  })

  gulp.task('dev-server', () => {
    const app = new express()
    const target = `http://${reactorHost}:${reactorPort}`

    return pump(
      gulp.src(template),
      through.obj((file, encode, callback) => {
        // proxy the /_compile/*.elm files to elm-reactor
        app.use(
          proxy('/_compile', {
            target,
          })
        )

        app.get('*.elm', [
          // do live reload on this page
          livereloadConnect({
            port: 35729,
            include: [/(.)*\.elm/],
          }),
          // handle with html template
          (request, response) => {
            anyTemplate.compiler(file.path)(String(file.contents), {
              environment: 'development',
              options,
              request,
            }).then(res => response.send(res))
          },
        ])

        // static assets
        app.use('/public', express.static(tmpDir))

        // proxy all other requests to elm-reactor
        app.use(
          proxy({
            target,
          })
        )

        app.listen(port, host, err => {
          livereload.listen()
        })

        callback()
      })
    )
  })

  let mainWatcher

  gulp.task('dev-main', () => {
    livereload.reload()
    mainWatcher && mainWatcher.end()
    mainWatcher = gulp.watch(main, ['dev-main'])

    return pump(
      gulp.src(main),
      elmFindDependencies(),
      through.obj((file, encode, callback) => {
        const cssWatched = cssWatcher._watcher._watched
        const cssWatchedFiles = Object.keys(cssWatched).reduce((acc, key) => {
          return [...acc, ...cssWatched[key]]
        }, [])
        if (!cssWatchedFiles.includes(file.path)) {
          mainWatcher._watcher.add(file.path)
        }
        callback()
      })
    )
  })

  let cssWatcher

  gulp.task('dev-css', callback => {
    cssWatcher && cssWatcher.end()
    cssWatcher = gulp.watch(stylesheets, ['dev-css'])

    pump(gulp.src(stylesheets), elmCss({ out: tmpDir }), livereload())

    return pump(
      gulp.src(stylesheets),
      elmFindDependencies(),
      through.obj((file, encode, cb) => {
        cssWatcher._watcher.add(file.path)
        cb()
      })
    )
  })

  gulp.task('dev', () => {
    runSequence(['dev-reactor', 'dev-server'], 'dev-css', 'dev-main')
  })
}

module.exports = dev
