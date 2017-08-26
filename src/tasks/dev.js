const anyTemplate = require('gulp-any-template')
const express = require('express')
const gulp = require('gulp')
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
const elmFindDependencies = require('gulp-elm-find-dependencies')
const elmCss = require('gulp-elm-css')

const defaults = require('../defaults').dev

const dev = options => {
  const { name: tmpDir } = tmp.dirSync({ unsafeCleanup: true })
  const {
    main = defaults.main,
    stylesheets = defaults.stylesheets,
    template = defaults.template,
    host = defaults.host,
    port = defaults.port,
    reactorHost = defaults.reactorHost,
    reactorPort = defaults.reactorPort,
    lrPort = defaults.lrPort,
  } = options

  // is there a better way to link the dev-server and dev-template tasks...?
  let templateCompiler = () => Promise.resolve('template is compiling...')

  // is there a better way to use gulp.watch and find-elm-dependencies...?
  let templateWatcher
  let mainWatcher
  let cssWatcher

  gulp.task('dev-reactor', () => {
    const reactor = spawn(
      'elm-reactor',
      [`--port=${reactorPort}`, `--address=${reactorHost}`],
      { stdio: 'inherit' }
    )
  })

  gulp.task('dev-server', callback => {
    const app = new express()
    const reactor = `http://${reactorHost}:${reactorPort}`

    app
      .use(nocache())
      // serve up static assets
      .use('/public', express.static(tmpDir))
      // proxy _compile to elm-reactor and do livereload
      .use('/_compile', [
        lrConnect({
          port: lrPort,
        }),
        proxy({
          // pathRewrite: { '.elm': `.elm?t=${new Date().getTime()}` },
          target: reactor,
        }),
      ])
      // serve up elm file with custom template middleware and do livereload
      .get('*.elm', [
        lrConnect({
          port: lrPort,
          include: [/(.)*\.elm/],
        }),
        (request, response) => {
          templateCompiler({
            environment: 'development',
            livereload: defaults.livereload,
            options,
            request,
          })
            .then(res => response.send(res))
            .catch(err => console.error(err.message))
        },
      ])
      // proxy all other requests to elm-reactor
      .use(
        proxy({
          target: reactor,
        })
      )
      // begin the dev server
      .listen(port, host, err => {
        // begin the livereload server
        lr.listen({ port: lrPort })
        callback()
      })
  })

  gulp.task('dev-template', callback => {
    templateWatcher && templateWatcher.end()
    templateWatcher = gulp.watch(template, ['dev-template'])

    return pump(
      gulp.src(template),
      through.obj(function(file, encode, cb) {
        this.push(file)
        templateCompiler = anyTemplate.compiler(file)
        cb()
      }),
      lr()
    )
  })

  gulp.task('dev-css', callback => {
    cssWatcher && cssWatcher.end()
    cssWatcher = gulp.watch(stylesheets, ['dev-css'])

    pump(gulp.src(stylesheets), elmCss({ out: tmpDir }), lr())

    return pump(
      gulp.src(stylesheets),
      elmFindDependencies(),
      through.obj(function(file, encode, cb) {
        cssWatcher._watcher.add(file.path)
        cb()
      })
    )
  })

  gulp.task('dev-main', () => {
    lr.reload()
    mainWatcher && mainWatcher.end()
    mainWatcher = gulp.watch(main, ['dev-main'])

    // get stylesheet watched files
    const cssWatched = cssWatcher ? cssWatcher._watcher._watched : {}
    const cssWatchedFiles = Object.keys(cssWatched).reduce((acc, key) => {
      return [...acc, ...cssWatched[key]]
    }, [])

    return pump(
      gulp.src(main),
      elmFindDependencies(),
      through.obj((file, encode, callback) => {
        // exclude stylesheet watched files from main tree watcher because we
        // css injection will be used on those files
        if (!cssWatchedFiles.includes(file.path)) {
          mainWatcher._watcher.add(file.path)
        }

        callback()
      })
    )
  })

  gulp.task('dev', () => {
    // order matters here, we need to find which css files are watched
    // before we create the main watcher
    runSequence(
      ['dev-reactor', 'dev-server'],
      'dev-css',
      'dev-main',
      'dev-template'
    )
  })
}

module.exports = dev
