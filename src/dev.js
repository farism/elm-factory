const chalk = require('chalk')
const chokidar = require('chokidar')
const express = require('express')
const findElmDependencies = require('find-elm-dependencies').findAllDependencies
const http = require('http')
const livereload = require('livereload')
const livereloadConnect = require('connect-livereload')
const onExit = require('signal-exit')
const path = require('path')
const proxy = require('http-proxy-middleware')
const spawn = require('child_process').spawn
const tmp = require('tmp-promise')

const {
  compileCss,
  colors,
  defaults,
  elapsed,
  loadTemplate,
  spacer,
  validateFile,
} = require('./core')

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

// create an elm-reactor process

async function startElmReactor(host, port) {
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
    colors.startup(`elm-reactor started at ${host}:${port} ${elapsed(t)}`),
  )

  return reactor
}

// create a live reload server

const startLiveReload = (dir, host, port) => {
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

function startExpressApp(dir, erHost, erPort, lrPort, template, host, port) {
  const t = new Date()
  console.log(colors.startup('elm-factory server starting...'))

  return new Promise((resolve, reject) => {
    const app = new express()
    const erTarget = `http://${erHost}:${erPort}`

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
          livereloadConnect({
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
      console.info(colors.files(`[Stylesheets:changed] ${file}`))

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

async function dev({
  main = defaults.main,
  stylesheets = defaults.stylesheets,
  host = '127.0.0.1',
  port = 8000,
  template = defaults.template,
  reactorHost,
  reactorPort = 8001,
  livereloadPort = 35729,
}) {
  // get a tmp dir for assets and live reload
  const {path: dir} = await tmp.dir()

  // proceses
  try {
    await validateFile('[Main:notfound]', main)
    await validateFile('[Stylesheets:notfound]', stylesheets)
    await validateFile('[Template:notfound]', stylesheets)
    const reactor = await startElmReactor(reactorHost, reactorPort)
    spacer()
    const lr = await startLiveReload(dir, host, port)
    spacer()
    const appTemplate = await loadTemplate(template)
    const app = await startExpressApp(
      dir,
      reactorHost,
      reactorPort,
      livereloadPort,
      appTemplate,
      host,
      port,
    )
    spacer()

    // file watchers
    const stylesheetWatcher = await startStylesheetWatcher(dir, lr, stylesheets)
    const mainWatcher = await startMainWatcher(dir, lr, stylesheetWatcher, main)
  } catch (e) {
    console.error(colors.error(e))
    console.error(colors.error('Exiting'))
    process.exit(1)
  }

  console.info(colors.files(`[Main:use] ${main}`))
  console.info(colors.files(`[Stylesheets:use] ${stylesheets}`))
  spacer()
  console.info(
    chalk.bold.yellow(
      `elm-factory dev server is ready!! -> http://${host}:${port}`,
    ),
  )
  console.info(chalk.bold.yellow(`> performing an initial compile of assets`))
  spacer()

  // do initial asset compilation
  compileCss(dir, stylesheets)
}

module.exports = dev
