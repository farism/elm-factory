const assetManifest = require('gulp-asset-manifest')
const connect = require('connect')
const cssnano = require('cssnano')
const elm = require('gulp-elm')
const express = require('express')
const {findAllDependencies} = require('find-elm-dependencies')
const gulp = require('gulp')
const handlebars = require('handlebars')
const livereload = require('gulp-livereload')
const livereloadConnect = require('connect-livereload')
const lr = require('tiny-lr')()
const merge = require('gulp-merge')
const path = require('path')
const portscanner = require('portscanner')
const postcss = require('gulp-postcss')
const proxy = require('http-proxy-middleware')
const spawn = require('cross-spawn')
const rev = require('gulp-rev')
const runSequence = require('run-sequence')
const tmp = require('tmp')
const url = require('postcss-url')

const elmCss = require('./src/gulp-elm-css')

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

const {name: tmpDir} = tmp.dirSync()

const build = ({
  main = './src/Main.elm',
  stylesheets = './src/Stylesheets.elm',
  output = './dist',
}) => {
  gulp.task('build', () =>
    merge(
      gulp.src(main).pipe(elm()),
      gulp.src(stylesheets).pipe(elmCss()).pipe(
        postcss([
          url({
            url: 'copy',
            basePath: path.resolve('./'),
            assetsPath: path.resolve(output),
            useHash: true,
          }),
          url({
            url: asset => path.join('/public/', path.basename(asset.url)),
          }),
          cssnano(),
        ]),
      ),
    )
      .pipe(rev())
      .pipe(gulp.dest('dist')),
  )
}

const dev = ({
  main = './src/Main.elm',
  stylesheets = './src/Stylesheets.elm',
  host = '127.0.0.1',
  port,
  reactorHost = '127.0.0.1',
  reactorPort,
}) => {
  gulp.task('reactor', callback => {
    spawn(
      'elm-reactor',
      [`--port=${reactorPort}`, `--address=${reactorHost}`],
      {
        stdio: 'inherit',
      },
    )
  })

  gulp.task('server', () => {
    const app = new express()
    const target = `http://${reactorHost}:${reactorPort}`
    const template = handlebars.compile(templateStr)

    // proxy the /_compile/*.elm files to elm-reactor
    app.use(
      proxy('/_compile', {
        target,
      }),
    )

    app.get('*.elm', [
      // do live reload on this page
      livereloadConnect({
        port: 35729,
        include: [/(.)*\.elm/],
      }),
      // handle with html template
      (req, res) => {
        res.send(template({path: req.url}))
      },
    ])

    // static assets
    app.use('/public', express.static(tmpDir))

    // proxy all other requests to elm-reactor
    app.use(
      proxy({
        target,
      }),
    )

    app.listen(port, host)
  })

  gulp.task('css', () =>
    gulp.src(stylesheets).pipe(elmCss({out: tmpDir})).pipe(livereload()),
  )

  let mainWatcher = null

  gulp.task('watch-main', () => {
    mainWatcher && mainWatcher.end()
    findAllDependencies(main).then(
      files => (mainWatcher = gulp.watch(files, ['watch-main'])),
    )
  })

  let cssWatcher = null

  gulp.task('watch-css', () => {
    cssWatcher && cssWatcher.end()
    findAllDependencies(main).then(
      files => (cssWatcher = gulp.watch(files, ['watch-css'])),
    )
  })

  gulp.task('dev', () => {
    livereload.listen()
    runSequence(['reactor', 'server', 'css', 'watch-main', 'watch-css'])
  })
}

module.exports = {
  build,
  dev,
}
