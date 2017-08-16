const connect = require('connect')
const cssnano = require('cssnano')
const elm = require('gulp-elm')
const express = require('express')
const gulp = require('gulp')
const handlebars = require('handlebars')
const livereload = require('gulp-livereload')
const livereloadConnect = require('connect-livereload')
const lr = require('tiny-lr')()
const os = require('os')
const path = require('path')
const plumber = require('gulp-plumber')
const postcss = require('gulp-postcss')
const proxy = require('http-proxy-middleware')
const shell = require('gulp-shell')
const spawn = require('cross-spawn')
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

const template = handlebars.compile(templateStr)

gulp.task('build-main', () =>
  gulp.src('src/Main.elm').pipe(elm()).pipe(gulp.dest('dist/')),
)

gulp.task('build-css', () =>
  gulp
    .src('src/Stylesheets.elm')
    .pipe(elmCss())
    .pipe(
      postcss([
        url({
          url: 'copy',
          basePath: path.resolve('./'),
          assetsPath: path.resolve('dist'),
          useHash: true,
        }),
        url({url: asset => path.join('/public/', path.basename(asset.url))}),
        cssnano(),
      ]),
    )
    .pipe(gulp.dest('dist')),
)

gulp.task('css', () =>
  gulp
    .src('src/Stylesheets.elm')
    .pipe(elmCss({out: tmpDir}))
    .pipe(livereload()),
)

gulp.task('reactor', () => {
  spawn('elm-reactor', [`--port=8001`, `--address=127.0.0.1`], {
    stdio: 'inherit',
  })
})

gulp.task('server', () => {
  const app = new express()
  const target = 'http://127.0.0.1:8001'

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
      console.log(req.url)
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

  app.listen(8000, '127.0.0.1')
})

gulp.task('watch', () => {
  livereload.listen()
  gulp.watch('src/*Css.elm', ['elm-css-dev'])
})

gulp.task('build', ['build-main', 'build-css'])

gulp.task('dev', ['css', 'reactor', 'server', 'watch'])

gulp.task('default', ['dev'])
