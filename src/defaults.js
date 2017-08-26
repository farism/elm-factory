const main = './src/Main.elm'
const stylesheets = './src/Stylesheets.elm'
const template = './index.ejs'
const host = '127.0.0.1'
const port = 8000

const build = {
  main,
  stylesheets,
  template: undefined,
  outputPath: 'build',
  publicPath: '/public/',
}

const dev = {
  main,
  stylesheets,
  template,
  host,
  port,
  reactorHost: host,
  reactorPort: port + 1,
  lrPort: 35729,
}

const init = {}

module.exports = {
  build,
  dev,
  init,
}
