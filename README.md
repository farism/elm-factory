# Elm Factory [![npm version](https://badge.fury.io/js/elm-factory.svg)](https://badge.fury.io/js/elm-factory) [![Coverage Status](https://coveralls.io/repos/github/farism/elm-factory/badge.svg?branch=specs)](https://coveralls.io/github/farism/elm-factory?branch=specs) [![Travis CI](https://api.travis-ci.org/farism/elm-factory.svg?branch=master)](https://travis-ci.org/farism/elm-factory)

An all-in-one, zero-configuration CLI tool for developing, building, and deploying Elm applications. Don't worry about tooling and just code!

### About

Elm is an awesome language. It has a lot of great individual tooling. However, using them all together in some type of workflow can be a bit tedious. On top of that, some of the tools (e.g. `elm-reactor`) lack some basic features that would make them into more full-fledged developer tools.

This is where `Elm Factory` comes in. One of the goals of this project was to not deviate too much from the exiting elm-tooling ecoystem. It is essentially a CLI tool that is a thin wrapper over a few core libraries while exposing additional functionality, and with only a few basic commands:

- `init` to scaffold new Elm projects
- `dev` to start up an express server to proxy elm-reactor
- `build` to create cache-busted and minified production builds

### Features
- Custom html templates with elm-reactor
- Stylesheet management via elm-css
- CSS injection with livereload
- Define custom proxy endpoints
- Production mode builds with cache-busting

### Getting Started

```sh
# Installation

yarn global add elm-factory
npm install -g elm-factory

# Create a new project

elm-factory init my-app && cd my-app

# Start the elm-factory dev server

elm-factory dev --port=3000 --template=index.dev.hbs

# Build the project for production

elm-factory build --output-path=dist --template=index.prod.hbs

```

Please see the [cli usage](https://github.com/farism/elm-factory/blob/master/guides/cli-usage.md) for a full list of options


### Configuration

Project configuration is available through an `.elmfactoryrc` or `.elmfactoryrc.json` file:
```json
{
  "main": "src/MyApp.elm",
  "build": {
    "template": "index.prod.hbs"
  },
  "dev": {
    "port": 3000,
    "template": "index.dev.hbs"
  }
}
```

Please see the [configuration page](https://github.com/farism/elm-factory/blob/master/guides/configuration.md) for a full list of options

### Underlying Libraries

- `gulp` for orchestrating CLI tasks
- `elm-reactor` for on-the-fly compilation
- `express` server for custom templates
- `livereload` for css injection and browser refresh
- `elm-css` for managing stylesheets and extracting css assets
- `find-elm-dependencies` for dev mode watching
- `node-elm-compiler` for compiling production builds
- `rev-all` for production mode cache-busting
- `uglifyjs` for production mode minification

### Contributing

Ideas and code contributions are welcome! In lieu of a styleguide, this project uses [prettier](https://github.com/prettier/prettier), [husky](https://github.com/typicode/husky), and [lint-staged](https://github.com/okonet/lint-staged) to maintain code style. If you have any questions, just ask.

### Related projects
[elm-live](https://github.com/tomekwi/elm-live)
[elm-webpack-starter](https://github.com/jiwhiz/elm-bootstrap-webpack-starter)
