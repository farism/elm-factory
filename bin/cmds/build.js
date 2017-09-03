const gulp = require('gulp')

const config = require('./config').build
const build = require('../../src/cmds').build

module.exports = {
  command: build.command,
  description: build.description,
  builder: function(yargs) {
    yargs
      .options(build.options)
      .config(config)
      .help('help')
  },
  handler: function(argv) {
    require('../../src/tasks')
      .build(argv)
      .catch(e => {})
  },
}
