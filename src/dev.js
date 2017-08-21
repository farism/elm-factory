const express = require('express')
const gulp = require('gulp')
const handlebars = require('handlebars')
const livereload = require('gulp-livereload')
const livereloadConnect = require('connect-livereload')
const path = require('path')
const proxy = require('http-proxy-middleware')
const pump = require('pump')
const spawn = require('cross-spawn')
const runSequence = require('run-sequence')
const through = require('through2')
const tmp = require('tmp')
const watch = require('gulp-watch')
const elmFindDependencies = require('gulp-elm-find-dependencies')
const elmCss = require('gulp-elm-css')

const templateStr = `
<!DOCTYPE HTML>
<html>
  <head>
    <meta charset="UTF-8">
    <title>~{{path}}</title>
    <style type="text/css">
      @import url(http://fonts.googleapis.com/css?family=Source+Sans+Pro);
      html, head, body {
        margin: 0;
        height: 100%;
      }
    </style>
    <link rel="stylesheet" href="http://localhost:8000/public/index.css">
  </head>
  <body>
    <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #9A9A9A; font-family: &#39;Source Sans Pro&#39;;">
      <div style="font-size: 3em;">Building your project!</div>
      <img src="/_reactor/waiting.gif">
      <div style="font-size: 1em">With new projects, I need a bunch of extra time to download packages.</div>
    </div>
  </body>
  <script src="/_compile{{path}}" charset="utf-8"></script>
  <script>
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild)
    }
    runElmProgram()
  </script>
</html>
`

const dev = ({
  main = './src/Main.elm',
  stylesheets = './src/Stylesheets.elm',
  host = '127.0.0.1',
  port,
  reactorHost = '127.0.0.1',
  reactorPort,
}) => {
  const { name: tmpDir } = tmp.dirSync()

  gulp.task('dev-reactor', () => {
    spawn(
      'elm-reactor',
      [`--port=${reactorPort}`, `--address=${reactorHost}`],
      { stdio: 'inherit' }
    )
  })

  gulp.task('dev-server', () => {
    const app = new express()
    const target = `http://${reactorHost}:${reactorPort}`
    const template = handlebars.compile(templateStr)

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
      (req, res) => {
        res.send(template({ path: req.url }))
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

    app.listen(port, host, () => {
      livereload.listen()
    })
  })

  let mainWatcher

  gulp.task('dev-main', () => {
    livereload.reload()
    mainWatcher && mainWatcher.end()
    mainWatcher = gulp.watch(main, ['dev-main'])

    return pump([
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
      }),
    ])
  })

  let cssWatcher

  gulp.task('dev-css', callback => {
    cssWatcher && cssWatcher.end()
    cssWatcher = gulp.watch(stylesheets, ['dev-css'])

    pump([gulp.src(stylesheets), elmCss({ out: tmpDir }), livereload()])

    return pump([
      gulp.src(stylesheets),
      elmFindDependencies(),
      through.obj((file, encode, cb) => {
        cssWatcher._watcher.add(file.path)
        cb()
      }),
    ])
  })

  gulp.task('dev', () => {
    runSequence(['dev-reactor', 'dev-server'], 'dev-css', 'dev-main')
  })
}

module.exports = dev
