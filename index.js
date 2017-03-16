const child_process = require('child_process')
const express = require('express')
const request = require('request-promise')

// init elm-reactor
const reactor = child_process.exec('elm-reactor --address=127.0.0.1 --port=8001')

// init express server
const app = new express()

// catch all route, proxied to elm-reactor server
app.get('*', function(clientRequest, clientResponse) {
    request(`http://localhost:8001${clientRequest.url}`)
      .then(reactorResponse => {
        clientResponse.send(reactorResponse)
      })
      .catch(reactorError => {
        return request(`http://localhost:8001${clientRequest.url}`)
      })
      .then(proxyResponse => {
      })
      .catch(proxyError => {
      })
})

app.listen(8000, () => {
  console.log('elm-reactor-proxy listening on port 8001!')
})

process.on('exit', code => {
  reactor.kill('SIGINT')
  process.exit (code)
})

// Catch CTRL+C
process.on('SIGINT', () => {
  reactor.kill('SIGINT')
  process.exit (0)
})

// Catch uncaught exception
process.on('uncaughtException', err => {
  reactor.kill('SIGINT')
  process.exit (1)
})
