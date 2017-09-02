const gulp = require('gulp')

const init = require('../../src/cmds/init')

module.exports = {
  command: init.command,
  desc: init.description,
  builder: function(yargs) {
    yargs
      .options(init.options)
      .demandOption('dir', 'You must enter a project name')
  },
  handler: function(argv) {
    require('../../src/tasks')
      .init(argv)
      .catch(() => {})
  },
}
