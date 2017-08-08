const chalk = require('chalk')
const chokidar = require('chokidar')
const elmCss = require('elm-css')
const express = require('express')
const findElmDependencies = require('find-elm-dependencies').findAllDependencies
const handlebars = require('handlebars')
const http = require('http')
const livereload = require('livereload')
const mkdirp = require('mkdirp')
const onExit = require('signal-exit')
const path = require('path')
const proxy = require('http-proxy-middleware')
const request = require('request-promise')
const spawn = require('child_process').spawn
const tmp = require('tmp')

const MAIN_ENTRY = './src/elm/HelloWorld.elm'
const STYLESHEET_ENTRY = './src/elm/Stylesheets.elm'
const WATCHER_OPTS = {
  awaitWriteFinish: {
    stabilityThreshold: 500,
    pollInterval: 100,
  },
}
const TEMPLATE = `<!DOCTYPE HTML>
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

const proc = chalk.magentaBright
const file = chalk.cyanBright
const elm = chalk.greenBright
const err = chalk.red
const quiet = chalk.dim

function isPortOpen(port, address = 'localhost') {
  return new Promise((resolve, reject) => {
    try {
      const server = http.createServer()
      server.on('error', () => {
        resolve(false)
      })
      server.on('listening', () => {
        server.close(() => resolve(true))
      })
      server.listen(port, address)
    } catch (error) {
      reject(error)
    }
  })
}

function compileCss(
  entry,
  output,
  module = 'Stylesheets',
  port = 'files',
  root_ = process.cwd(),
) {
  const t = new Date();
  console.info(elm('elm-css started compiling...'))

  return new Promise((resolve, reject) => {
    elmCss(root_, entry, output, module, port)
      .then(() => {
        console.info(elm(`elm-css finished compiling ${elapsed(t)}`))
        resolve()
      })
      .catch((err) => reject(err))
  })
}

// create an elm-reactor process

function elapsed(start) {
  const str = start ? `(${new Date().getTime() - start.getTime()}ms)` : ''

  return quiet(str)
}

function startElmReactor(port, host) {
  const t = new Date()
  console.info(proc('elm-reactor starting...'))

  return new Promise((resolve, reject) => {
    isPortOpen(port).then(isOpen => {
      if (isOpen) {
        const reactor = spawn(
          'elm-reactor',
          [`--port=${port}`, `--address=${host}`],
          {detached: true},
        )

        onExit(function(code, signal) {
          process.kill(-reactor.pid)
        })

        console.info(
          proc(`elm-reactor started on ${host}:${port} ${elapsed(t)}`),
        )
        resolve(reactor)
      } else {
        reject(
          `elm-reactor --port=${port} --address=${host}: resource busy (Address already in use)`,
        )
      }
    })
  })
}

// create a live reload server

const startLiveReload = (dir, port, host) => {
  const t = new Date()
  console.log(chalk.magentaBright('live-reload starting...'))

  return new Promise((resolve, reject) => {
    const lr = livereload.createServer(
      {
        originalPath: `${host}:${port}`,
        // debug: true,
      },
      () => {
        lr.watch(dir)
        console.log(
          chalk.magentaBright(
            `live-reload started proxying on ${host}:${port} ${elapsed(t)}`,
          ),
        )
        resolve(lr)
      },
    )
  })
}

// create an express server

function startExpressApp(dir, lrPort, erPort, erHost, port, host) {
  const t = new Date()
  console.log(chalk.magentaBright('elm-factory server starting...'))

  return new Promise((resolve, reject) => {
    const app = new express()
    const elmReactorTarget = `http://${erHost}:${erPort}`

    // static file serving
    app.use('/public', express.static(dir))

    // custom api proxy to get around cors
    // app.use(
    //   proxy('/api', {
    //     target: elmReactorTarget,
    //   }),
    // )

    // handle the /_compile/*.elm files specifically to elm-reactor
    app.use(
      proxy('/_compile', {
        target: elmReactorTarget,
      }),
    )

    const template = handlebars.compile(TEMPLATE)

    app.get('*.elm', [
      // do live reload on this page
      require('connect-livereload')({
        port: lrPort,
        include: [/(.)*\.elm/],
      }),
      // handle with template
      (req, res) => {
        res.send(template({path: req.url}))
      },
    ])

    // proxy all other requests to elm-reactor
    app.use(
      proxy({
        target: elmReactorTarget,
      }),
    )

    app.listen(port, host, () => {
      console.log(
        chalk.magentaBright(
          `elm-factory server started on ${host}:${port} ${elapsed(t)}`,
        ),
      )
      resolve(app)
    })
  })
}

function onTrackerChanged(tracker, entry, onChange) {
  return file => {
    // immediately close tracker to clear all listeners before we rebuild dep tree
    tracker.close()

    findElmDependencies(entry).then(files => {
      // re-add the onChange listener
      tracker.on('change', onTrackerChanged(tracker, entry, onChange))

      // and entry and new files to the tracker
      tracker.add([entry, ...files])
    })

    onChange(file)
  }
}

function addDepsToTracker(entry, onChange, tracker) {
  return new Promise((resolve, reject) => {
    findElmDependencies(entry)
      .then(files => {
        tracker.on('change', onTrackerChanged(tracker, entry, onChange))

        tracker.add([entry, ...files])

        resolve(tracker)
      })
      .catch(error => {
        reject(error)
      })
  })
}

function dev(mainEntry, stylesheetEntry, trackerOpts) {
  // create a tmp dir to serve assets from
  tmp.dir(function(err, tmpDir) {
    if (err) {
      console.error(chalk.red(err))
    } else {
      const lrPort = 35729
      const erPort = 8002
      const erHost = '127.0.0.1'
      const port = 8000
      const host = '127.0.0.1'

      startElmReactor(erPort, erHost)
        .then(() => compileCss(stylesheetEntry, tmpDir))
        .then(() => startLiveReload(tmpDir, port, host))
        .then(() => startExpressApp(tmpDir, lrPort, erPort, erHost, port, host))
        .then(lr => {
          const stylesheetTracker = chokidar.watch([], {ignored: () => false})

          const stylesheetTrackerWithDeps = addDepsToTracker(
            stylesheetEntry,
            file => {
              console.info(chalk.yellow('[Stylesheet changed]', file))
              console.log(lr.filterRefresh)
              // lr.filterRefresh(file)
            },
            stylesheetTracker,
          )

          const mainTracker = chokidar.watch([], {
            ignored: file => {
              // if the edited file is currently being
              // watched by the stylesheet tracker, ignore it
              return Object.values(stylesheetTracker.getWatched()).some(arr =>
                arr.includes(path.basename(file)),
              )
            },
          })

          const mainTrackerWithDeps = addDepsToTracker(
            mainEntry,
            file => {
              console.info(chalk.yellow('[Main changed]', file))
              lr.refresh(file)
              console.log(lr.refresh, lr.filterRefresh)
            },
            mainTracker,
          )

          return Promise.all([stylesheetTrackerWithDeps, mainTrackerWithDeps])
        })
        .catch(err => console.error(chalk.red(err)))
    }
  })
}

function build(mainEntry, stylesheetEntry) {
  outputDir = path.join(process.cwd(), './dist')
  mkdirp(outputDir, () => {
    compileCss(stylesheetEntry, outputDir).then(() => {
      console.info('css done')
    })
  })
}

dev(MAIN_ENTRY, STYLESHEET_ENTRY, WATCHER_OPTS)

module.exports = {
  dev,
  build,
}
