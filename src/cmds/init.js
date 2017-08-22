const gulp = require('gulp')

module.exports = {
  command: 'init [dir]',
  desc: 'initializes a boilerplate Elm application',
  builder: function(yargs) {
    yargs.demandOption(['dir'], 'You must enter a project name')
  },
  handler: function(argv) {
    require('../tasks/init')(argv)
    gulp.start('init')
  },
}
