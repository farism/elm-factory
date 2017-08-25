const defaults = require('../../src/defaults').init

module.exports = {
  name: 'init',
  command: 'init [dir]',
  description: 'initializes a boilerplate elm-factory application',
  options: {
    dir: {
      description: 'the project directory',
    },
  },
}
