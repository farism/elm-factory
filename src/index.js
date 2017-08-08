const chalk = require('chalk')
const chokidar = require('chokidar')
const elmCss = require('elm-css')
const express = require('express')
const findElmDependencies = require('find-elm-dependencies').findAllDependencies
const fs = require('fs')
const handlebars = require('handlebars')
const http = require('http')
const livereload = require('livereload')
const mkdirp = require('mkdirp')
const onExit = require('signal-exit')
const path = require('path')
const prettyMs = require('pretty-ms')
const proxy = require('http-proxy-middleware')
const request = require('request-promise')
const spawn = require('child_process').spawn
const tmp = require('tmp-promise')

const ELM_PACKAGE_NAME = 'elm-package.json'
const MAIN_ENTRY = './src/elm/HelloWorld.elm'
const STYLESHEET_ENTRY = './src/elm/Stylesheets.elm'
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

const colors = {
  startup: chalk.bold.magentaBright,
  ready: chalk.bold.yellow,
  files: chalk.bold.cyan,
  error: chalk.bold.red,
}

function isPortOpen(port, address = 'localhost') {
  return new Promise((resolve, reject) => {
    try {
      const server = http.createServer()
      server.on('error', e => {
        reject(new Error(e))
      })
      server.on('listening', () => {
        server.close(() => resolve(true))
      })
      server.listen(port, address)
    } catch (e) {
      reject(e)
    }
  })
}

async function compileCss(
  output,
  entry,
  module = 'Stylesheets',
  port = 'files',
  root_ = process.cwd(),
) {
  try {
    const t = new Date()
    console.info(colors.files(`[Stylesheet:compile:start] ${entry}`))
    await elmCss(root_, entry, output, module, port)
    console.info(
      colors.files(`[Stylesheet:compile:done] ${entry} ${elapsed(t)}`),
    )
  } catch (e) {
    console.error(colors.error(`[Stylesheet:compile:fail] ${entry}`))
  }
}

function spacer(char = '-', len = 60) {
  console.info(chalk.dim(char.repeat(len)))
}

function elapsed(start) {
  const str = start
    ? `(${prettyMs(new Date().getTime() - start.getTime())})`
    : ''

  return chalk.dim(str)
}

// create an elm-reactor process

async function startElmReactor(port, host) {
  const t = new Date()
  console.info(colors.startup(`elm-reactor starting...`))

  try {
    const isOpen = await isPortOpen(port)
  } catch (e) {
    throw new Error(
      `elm-reactor --port=${port} --address=${host}: resource busy (Address already in use)`,
    )
  }

  const reactor = spawn(
    'elm-reactor',
    [`--port=${port}`, `--address=${host}`],
    {
      detached: true, // running as detached or else child.pid returns the wrong pid
    },
  )

  onExit(function(code, signal) {
    process.kill(-reactor.pid) // - kills process group range
  })

  console.info(
    colors.startup(
      `elm-reactor started at ${host}:${port} ${elapsed(t)}`,
    ),
  )

  return reactor
}

// create a live reload server

const startLiveReload = (dir, port, host) => {
  const t = new Date()
  console.log(colors.startup('live-reload starting...'))

  return new Promise((resolve, reject) => {
    const lr = livereload.createServer(
      {
        originalPath: `${host}:${port}`,
        // debug: true,
      },
      () => {
        lr.watch(dir)

        console.log(
          colors.startup(
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
  console.log(colors.startup('elm-factory server starting...'))

  return new Promise((resolve, reject) => {
    const app = new express()
    const erTarget = `http://${erHost}:${erPort}`
    const template = handlebars.compile(TEMPLATE)

    app
      .listen(port, host, err => {
        console.log(
          colors.startup(
            `elm-factory server started at ${host}:${port} ${elapsed(t)}`,
          ),
        )

        // handle the /_compile/*.elm files specifically to elm-reactor
        app.use(
          proxy('/_compile', {
            target: erTarget,
          }),
        )

        app.get('*.elm', [
          // do live reload on this page
          require('connect-livereload')({
            port: lrPort,
            include: [/(.)*\.elm/],
          }),
          // handle with html template
          (req, res) => {
            res.send(template({path: req.url}))
          },
        ])

        // custom api proxy to get around cors
        // app.use(
        //   proxy('/api', {
        //     target: erTarget,
        //   }),
        // )

        // static file serving
        app.use('/public', express.static(dir))

        // proxy all other requests to elm-reactor
        app.use(
          proxy({
            target: erTarget,
          }),
        )

        resolve(app)
      })
      .on('error', err => {
        reject(
          err.code === 'EADDRINUSE'
            ? `Could not start elm-reactor server: ${err.code}`
            : 'elm-reactor could not start server',
        )
      })
  })
}

async function addWatcherDeps(entry, onChange, watcher) {
  try {
    const files = await findElmDependencies(entry)

    watcher.add([entry, ...files])

    watcher.on('change', onChange)

    return watcher
  } catch (e) {
    console.error(colors.error(e))
  }
}

async function startStylesheetWatcher(dir, lr, entry) {
  const watcher = chokidar.watch([], {ignored: () => false})

  async function onChange(file) {
    try {
      const t = new Date()
      console.info(colors.files(`[Stylesheet:changed] ${file}`))

      // immediately close watcher to clear all listeners before we compile and rebuild dep tree
      watcher.close()

      await compileCss(dir, entry)

      await addWatcherDeps(entry, onChange, watcher)

      lr.filterRefresh(file)
    } catch (e) {
      console.error(colors.error(e))
    }
  }

  return await addWatcherDeps(entry, onChange, watcher)
}

async function startMainWatcher(dir, lr, stylesheetWatcher, entry) {
  const watcher = chokidar.watch([], {
    ignored: file => {
      // ignore file if it is being watched by the stylesheet watcher
      return Object.values(stylesheetWatcher.getWatched()).some(arr =>
        arr.includes(path.basename(file)),
      )
    },
  })

  async function onChange(file) {
    try {
      const t = new Date()
      console.info(colors.files(`[Main:changed], ${file}`))

      // immediately close watcher to clear all listeners before we rebuild dep tree
      watcher.close()

      await addWatcherDeps(entry, onChange, watcher)

      lr.refresh(file)
    } catch (e) {
      console.error(colors.error(e))
    }
  }

  return await addWatcherDeps(entry, onChange, watcher)
}

async function checkEntry(type, entry) {
  return new Promise((resolve, reject) => {
    const entryPath = path.join(process.cwd(), entry)

    fs.access(entryPath, 'r', err => {
      if (err) {
        reject(colors.error(`[${type}:entry:missing] ${entryPath}`))
      } else {
        resolve()
      }
    })
  })
}

async function dev(mainEntry, stylesheetEntry) {
  const port = 8000
  const host = '127.0.0.1'
  const lrPort = 35729
  const erPort = 8001
  const erHost = '127.0.0.1'

  // get a tmp dir for assets and live reload
  const {path: dir} = await tmp.dir()

  // proceses
  try {
    await checkEntry('Main', mainEntry)
    await checkEntry('Stylesheet', stylesheetEntry)
    const reactor = await startElmReactor(erPort, erHost)
    spacer()
    const lr = await startLiveReload(dir, port, host)
    spacer()
    const app = await startExpressApp(dir, lrPort, erPort, erHost, port, host)
    spacer()

    // file watchers
    const stylesheetWatcher = await startStylesheetWatcher(
      dir,
      lr,
      stylesheetEntry,
    )
    const mainWatcher = await startMainWatcher(
      dir,
      lr,
      stylesheetWatcher,
      mainEntry,
    )
  } catch (e) {
    console.error(colors.error(e))
    console.error(colors.error('Exiting'))
    process.exit(1)
  }

  console.info(colors.files(`[Main:entry:use] ${mainEntry}`))
  console.info(
    colors.files(`[Stylesheet:entry:use] ${stylesheetEntry}`),
  )
  spacer()
  console.info(
    chalk.bold.yellow(
      `elm-factory dev server is ready!! -> http://${host}:${port}`,
    ),
  )
  console.info(chalk.bold.yellow(`> performing an initial compile of assets`))
  spacer()

  // do initial asset compilation
  compileCss(dir, stylesheetEntry)
}

function build(mainEntry, stylesheetEntry) {
  outputDir = path.join(process.cwd(), './dist')
  mkdirp(outputDir, () => {
    compileCss(stylesheetEntry, outputDir).then(() => {
      console.info('css done')
    })
  })
}

dev(MAIN_ENTRY, STYLESHEET_ENTRY)

module.exports = {
  dev,
  build,
}
