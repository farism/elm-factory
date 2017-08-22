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
    require('../../src/tasks/dev')(argv)
    gulp.start('dev')
  },
}
