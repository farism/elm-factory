const child_process = require('child_process')
const chokidar = require('chokidar')
const express = require('express')
const request = require('request-promise')
const findElmDeps = require('find-elm-dependencies')

const entry = './src/Stylesheets.elm'

const addElmDependencies = (entry, watcher) => {
  findElmDeps.findAllDependencies(entry)
    .then((files) => {
      watcher.add(files)
    })
    .catch((err) => {
      console.log(err)
      reject(err)
    })
}

const watcher = chokidar.watch('./src/Stylesheets.elm', {
})

watcher.on('add', (path) => console.log('added: ', path))

watcher.on('unlink', (path) => console.log('unlinked: ', path))

watcher.on('change', (path) => {
  console.log('changed: ', path)

  try {
    watcher
      .unwatch('src/**/*.elm')
  } catch (e) {
    console.log(e)
  }

  setTimeout(() => {
    // watcher
    //   .add('./src/Stylesheets.elm')
  }, 150)
})

// start css watching
addElmDependencies(entry, watcher)

// init express server
const app = new express()

// catch all route, proxied first to elm-reactor server
// and then to a user defined proxy
app.get('*', function(req, res) {
  requestFromElmReactor(req, res)
})

const requestFromElmReactor = (req, res) => {
  request(`http://localhost:8001${req.url}`)
    .then(reactorResponse => {
      console.log('reactor 200:', req.url)

      res.send(reactorResponse)
    })
    .catch(reactorError => {
      console.log(`reactor ${reactorError.statusCode}:`, req.url)

      return requestFromProxy(req, res)
    })
}

const requestFromProxy = (req, res) => {
  return request(`http://localhost:3000${req.url}`)
    .then(proxyResponse => {
      console.log('proxy 200:', req.url)

      res.send(proxyResponse)
    })
    .catch(proxyError => {
      console.log(`proxy ${proxyError.statusCode}:`, req.url)

      res.send(proxyError)
    })
}




// start elm-reactor
const reactor = child_process.exec(
  `elm-reactor
  --address=127.0.0.1
  --port=8001`
)

// start express
app.listen(8000, () => {
  console.log('elm-reactor-proxy listening on port 8001!')
})














process.on('exit', code => {
  reactor.kill('SIGINT')
  process.exit (code)
})

// catch ctrl+c
process.on('SIGINT', () => {
  reactor.kill('SIGINT')
  process.exit (0)
})

// catch uncaught exception
process.on('uncaughtException', err => {
  reactor.kill('SIGINT')
  process.exit (1)
})
