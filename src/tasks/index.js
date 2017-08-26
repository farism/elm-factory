const build = require('./build').task
const dev = require('./dev').dev
const init = require('./init').task

module.exports = {
  build,
  dev,
  init,
}
