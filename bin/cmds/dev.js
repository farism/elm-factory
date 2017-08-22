const gulp = require('gulp')

const dev = require('../../src/cmds/dev')

module.exports = {
  command: dev.command,
  description: dev.description,
  builder: function(yargs) {
    yargs.options(dev.options)
  },
  handler: function(argv) {
    require('../../src/tasks/dev')(argv)
    gulp.start('dev')
  },
}
