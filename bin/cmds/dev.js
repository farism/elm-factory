const gulp = require('gulp')

const config = require('./config').dev
const dev = require('../../src/cmds').dev

module.exports = {
  command: dev.command,
  description: dev.description,
  builder: function(yargs) {
    yargs.options(dev.options).config(config)
  },
  handler: function(argv) {
    // convert single proxy option into an array
    if (typeof argv.proxy === 'string') {
      argv.proxy = [argv.proxy]
    }

    require('../../src/tasks')
      .dev(argv)
      .catch(() => {})
  },
}
