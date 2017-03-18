const child_process = require('child_process')
const chokidar = require('chokidar')
const express = require('express')
const request = require('request-promise')
const findElmDeps = require('find-elm-dependencies')

const ENTRY = './src/Stylesheets.elm'

const getElmDependencies = async (entry) => {
  try {
    return await findElmDeps.findAllDependencies(entry)
  } catch (e) {
    console.error(e)
  }

  return []
}

const addOnChange = async (entry, watcher) => {
  watcher.on('change', async (path) => {
    console.log('changed: ', path)

    const newFiles = await getElmDependencies(entry)

    try {
      watcher.close()
      addOnChange(entry, watcher)
      watcher.add([entry, ...newFiles])
    } catch (e) {
      console.log(e)
    }
  })
}

const initWatcher = async (entry) => {
  const files = await getElmDependencies(entry)

  const watcher = chokidar.watch([entry, ...files], {
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100
    },
  })

  addOnChange(entry, watcher)
}

initWatcher(ENTRY)

// start css watching
// addElmDependencies(entry, watcher)

// init express server
const app = new express()

// catch all route, proxied first to elm-reactor server
// and then to a user defined proxy
app.get('*', function(req, res) {
  requestFromElmReactor(req, res)
    .catch(reactorError => {
      console.log(`reactor ${reactorError.statusCode}:`, req.url)

      return requestFromProxy(req, res)
    })
    .catch(proxyError => {
      console.log(`proxy ${proxyError.statusCode}:`, req.url)

      res.send(proxyError)
    })
})

const requestFromElmReactor = (req, res) => {
  return request(`http://localhost:8001${req.url}`)
    .then(reactorResponse => {
      console.log('reactor 200:', req.url)

      res.send(reactorResponse)
    })
}

const requestFromProxy = (req, res) => {
  return request(`http://localhost:3000${req.url}`)
    .then(proxyResponse => {
      console.log('proxy 200:', req.url)

      res.send(proxyResponse)
    })
}


// start elm-reactor
// const reactor = child_process.spawn('elm-reactor', [
//   '--address=127.0.0.1',
//   '--port=8001',
// ])

// console.log('here', reactor.stderr)

// start express
// app.listen(8000, () => {
//   console.log('elm-reactor-proxy listening on port 8001!')
// })





//
//
// process.on('exit', code => {
//   reactor.kill('SIGINT')
//   process.exit(code)
// })
//
// // catch ctrl+c
// process.on('SIGINT', () => {
//   reactor.kill('SIGINT')
//   process.exit(0)
// })
//
// // catch uncaught exception
// process.on('uncaughtException', err => {
//   reactor.kill('SIGINT')
//   process.exit(1)
// })
