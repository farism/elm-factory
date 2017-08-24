const main = './src/Main.elm'
const stylesheets = './src/Stylesheets.elm'
const host = '127.0.0.1'
const port = 8000

const build = {
  main,
  stylesheets,
  outputPath: 'build',
  publicPath: '/public/',
}

const dev = {
  main,
  stylesheets,
  host,
  port,
  reactorHost: host,
  reactorPort: port + 1,
  template: './node_modules/elm-factory/src/tmpl/boilerplate/index.ejs',
}

const init = {}

module.exports = {
  build,
  dev,
  init,
}
