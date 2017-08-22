const build = {
  main: './src/Main.elm',
  stylesheets: './src/Stylesheets.elm',
  output: 'build',
  public: '/public/'
}

const dev = {
  main: './src/Main.elm',
  stylesheets: './src/Stylesheets.elm',
  host: '127.0.0.1',
  port: '8000',
  reactorHost: '127.0.0.1',
  reactorPort: '8001',
}

const init = {}

module.exports = {
  build,
  dev,
  init,
}
