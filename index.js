const fs = require('fs')
const child_process = require('child_process')
const path = require('path')
const chokidar = require('chokidar')
const express = require('express')
const request = require('request-promise')
const proxy = require('http-proxy-middleware')
const findElmDeps = require('find-elm-dependencies')

const ENTRY = './src/Stylesheets.elm'

const extractCss = () => {
  const output = path.join(process.cwd(), 'dist')
  const module = 'Stylesheets'
  const port = 'files'
  const root_ = ''

  // const start = new Date().getTime()

  child_process.exec(
    `elm-css ${ENTRY} -o ${output} -m ${module} -p ${port} -r ${root_}`
  )

  // console.log(new Date().getTime() - start)
}

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

    // close watcher and clear all listeners
    watcher.close()


    // readd on change listener
    addOnChange(entry, watcher)

    // get new dep tree and add it to watch
    const newFiles = await getElmDependencies(entry)
    watcher.add([entry, ...newFiles])

    // extract css to a file
    extractCss()
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

// init express server
const app = new express()

app.use(proxy('/_compile', {
  target: 'http://localhost:8001',
}))

app.get('*.elm', (req, res) => {
  res.send(fs.readFileSync('index.html').toString())
})

app.use(proxy({
  target: 'http://localhost:8001',
}))

// app.use(proxy('/api', {
//   target: 'http://localhost:8001',
// }))

// start watching css
// initWatcher(ENTRY)

// start elm-reactor
const reactor = child_process.spawn('elm-reactor', [
  '--address=127.0.0.1',
  '--port=8001',
])

// start express
app.listen(8000, () => {
  console.log('elm-reactor-proxy listening on port 8000!')
})

// catch exiting
process.on('exit', code => {
  reactor.kill('SIGINT')
  process.exit(code)
})

// catch ctrl+c
process.on('SIGINT', () => {
  reactor.kill('SIGINT')
  process.exit(0)
})

// catch uncaught exception
process.on('uncaughtException', err => {
  reactor.kill('SIGINT')
  process.exit(1)
})
