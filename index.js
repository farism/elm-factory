const child_process = require('child_process')
const express = require('express')
const request = require('request-promise')

// init elm-reactor
const reactor = child_process.exec(
  `elm-reactor
  --address=127.0.0.1
  --port=8001`
)

// init express server
const app = new express()

// catch all route, proxied first to elm-reactor server
// and then to a user defined proxy
app.get('*', function(req, res) {
    request(`http://localhost:8001${req.url}`)
      .then(reactorResponse => {
        console.log('reactor 200:', req.url)

        res.send(reactorResponse)
      })
      .catch(reactorError => {
        console.log(`reactor ${reactorError.statusCode}:`, req.url)

        return request(`http://localhost:3000${req.url}`)
          .then(proxyResponse => {
            console.log('proxy 200:', req.url)

            res.send(proxyResponse)
          })
          .catch(proxyError => {
            console.log(`proxy ${proxyError.statusCode}:`, req.url)

            res.send(proxyError)
          })
      })
})

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
