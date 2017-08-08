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

async function compileCss(
  output,
  entry,
  module = 'Stylesheets',
  port = 'files',
  root_ = process.cwd(),
) {
  try {
    await elmCss(root_, entry, output, module, port)
  } catch (e) {
    console.error(chalk.red(e))
    // throw new Error(e)
  }
}

function spacer(char = '=', len = 60) {
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
  try {
    const isOpen = await isPortOpen(port)

    if (isOpen) {
      const t = new Date()
      console.info(chalk.magentaBright(`elm-reactor starting...`))

      const reactor = spawn(
        'elm-reactor',
        [`--port=${port}`, `--address=${host}`],
        {
          detached: true,
        },
      )

      onExit(function(code, signal) {
        process.kill(-reactor.pid)
      })

      // reactor.stdout.on('data', (data) => {
      //   console.log(data.toString())
      // })

      console.info(
        chalk.bold.magentaBright(
          `elm-reactor started on ${host}:${port} ${elapsed(t)}`,
        ),
      )
      spacer()

      return reactor
    }
  } catch (e) {
    console.error(
      chalk.red(
        `elm-reactor --port=${port} --address=${host}: resource busy (Address already in use)`,
      ),
    )
  }
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
          chalk.bold.magentaBright(
            `live-reload started proxying on ${host}:${port} ${elapsed(t)}`,
          ),
        )
        spacer()

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
    const template = handlebars.compile(TEMPLATE)

    // handle the /_compile/*.elm files specifically to elm-reactor
    app.use(
      proxy('/_compile', {
        target: elmReactorTarget,
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
    //     target: elmReactorTarget,
    //   }),
    // )

    // static file serving
    app.use('/public', express.static(dir))

    // proxy all other requests to elm-reactor
    app.use(
      proxy({
        target: elmReactorTarget,
      }),
    )

    app.listen(port, host, () => {
      console.log(
        chalk.bold.magentaBright(
          `elm-factory server started on ${host}:${port} ${elapsed(t)}`,
        ),
      )
      spacer()

      resolve(app)
    })
  })
}

async function resetTrackerDeps(entry, onChange, tracker) {
  try {
    // immediately close tracker to clear all listeners before we rebuild dep tree
    tracker.close()

    const files = await findElmDependencies(entry)

    tracker.add([entry, ...files])

    tracker.on('change', onChange)

    return tracker
  } catch (e) {
    console.error(chalk.red(e))
  }
}

async function startStylesheetTracker(dir, lr, entry) {
  const tracker = chokidar.watch([], {ignored: () => false})

  async function onChange(file) {
    try {
      const t = new Date()

      console.info(chalk.cyan('[Stylesheet:changed]', `./${file}`))
      console.info(chalk.cyan(`[Stylesheet:compile:start] ${entry}`))

      await compileCss(dir, entry)

      resetTrackerDeps(entry, onChange, tracker)

      console.info(
        chalk.cyan(`[Stylesheet:compile:done] ${entry} ${elapsed(t)}`),
      )

      lr.filterRefresh(file)
    } catch (e) {
      console.error(chalk.red(e))
    }
  }

  return await resetTrackerDeps(entry, onChange, tracker)
}

async function startMainTracker(dir, lr, stylesheetTracker, entry) {
  const tracker = chokidar.watch([], {
    ignored: file => {
      // ignore file if it is being watched by the stylesheet tracker
      return Object.values(stylesheetTracker.getWatched()).some(arr =>
        arr.includes(path.basename(file)),
      )
    },
  })

  async function onChange(file) {
    try {
      const t = new Date()

      console.info(chalk.cyan('[Main:changed]', `./${file}`))

      resetTrackerDeps(entry, onChange, tracker)

      lr.refresh(file)
    } catch (e) {
      console.error(chalk.red(e))
    }
  }

  return await resetTrackerDeps(entry, onChange, tracker)
}

async function dev(mainEntry, stylesheetEntry) {
  const port = 8000
  const host = '127.0.0.1'
  const lrPort = 35729
  const erPort = 8001
  const erHost = '127.0.0.1'

  // get a tmp dir for assets and live reload
  const {path: tmpDir} = await tmp.dir()

  // proceses
  const reactor = await startElmReactor(erPort, erHost)
  const lr = await startLiveReload(tmpDir, port, host)
  const app = await startExpressApp(tmpDir, lrPort, erPort, erHost, port, host)

  // trackers
  const stylesheetTracker = await startStylesheetTracker(
    tmpDir,
    lr,
    stylesheetEntry,
  )
  const mainTracker = await startMainTracker(
    tmpDir,
    lr,
    stylesheetTracker,
    mainEntry,
  )

  console.info(
    chalk.yellow(`elm-factory dev server is ready!! -> http://${host}:${port}`),
  )
  console.info(
    chalk.yellow(`> now we will perform an initial compile of assets`),
  )
  spacer()
  console.info(chalk.bold.cyanBright(`[Main:entry] ${mainEntry}`))
  console.info(chalk.bold.cyanBright(`[Stylesheet:entry] ${stylesheetEntry}`))
  spacer()

  // do initial asset compilation
  compileCss(tmpDir, stylesheetEntry)
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
