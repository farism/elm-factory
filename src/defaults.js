const main = './src/Main.elm'
const stylesheets = './src/Stylesheets.elm'
const host = '127.0.0.1'
const port = 8000

const build = {
  main,
  stylesheets,
  output: 'build',
  public: '/public/',
}

const dev = {
  main,
  stylesheets,
  host,
  port,
  reactorHost: host,
  reactorPort: port + 1,
}

const init = {}

module.exports = {
  build,
  dev,
  init,
}
