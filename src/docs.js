module.exports = [
  {
    command: 'init',
    usage: [{ line: 'elm-factory init [path]' }],
    description: [
      'Initialies a new Elm application from a boilerplate. This application automatically includes the elm-css package and scaffolds some basic ',
    ],
    options: [],
  },
  {
    command: 'dev',
    usage: [{ line: 'elm-factory dev' }],
    description: [
      'Launches your Elm application in watch mode. This will start an express server that proxies requests down to a running instance of elm-reactor',
      'By default the dev server will launch from the current directory',
    ],
    options: [],
  },
  {
    command: 'build',
    usage: [{ line: 'elm-factory build' }],
    description: [
      'Builds your Elm application',
      'By default the build will start from the current directory',
    ],
    options: [],
  },
]
