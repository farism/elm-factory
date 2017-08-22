const gulp = require('gulp')

const build = require('../../src/cmds/build')

module.exports = {
  command: build.command,
  description: build.description,
  builder: function(yargs) {
    yargs.options(build.options).help('help')
  },
  handler: function(argv) {
    require('../../src/tasks/build')(argv)
    gulp.start('build')
  },
}
