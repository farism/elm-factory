const main = './src/Main.elm'
const stylesheets = './src/Stylesheets.elm'
const html = './index.ejs'
const host = '127.0.0.1'
const port = 8000

const build = {
  main,
  stylesheets,
  html: undefined,
  outputPath: 'build',
  publicPath: '/public/',
}

const dev = {
  stylesheets,
  html,
  host,
  port,
  reactorHost: host,
  reactorPort: port + 1,
  proxy: [],
  proxyRewrite: true,
}

const init = {
  force: false,
}

module.exports = {
  build,
  dev,
  init,
}
