# elm-reactor-proxy

A proxy configuration tool for elm-reactor

- [ ] CLI
- [ ] proxy elm reactor
- [ ] proxy custom server
- [ ] css file serving
- [ ] build pipeline for css and assets
- [ ] livereload
- [ ] elm-factory.json

options:

### css
- entry point (src/Css/Stylesheets.elm)
- module name (Css.Stylesheets)
- output dir (dist/)
- port (files)
- project root (.)
- elm make path

### reactor
- host (localhost)
- port (8001)
- handlebars template (index.hbs)

### custom proxy
- path (/api)
- host (localhost)
- port (8000)

### livereload
- debug (false)
- wait (100)


### cli stuff
no elm-factory.json in default location
  - defaults in commander? later
  - defaults in api.js?
  - specify elm-factory.json thru cli, merges with api.js defaults?

elm-factory.json in default location
  - always read from elm-factory.json, merge with index.js defaults?
  - if cli args specified, merge over elm-factory.json?

two commands
  - `elm-factory` starts dev server by default
  - `elm-factory dev` starts dev server
  - `elm-factory build` extracts css and

elm-factory.json {
  host http://localhost
  port 8000
  entry src/Main.elm
  elm-reactor {
    address http://localhost
    port 8000
  }
  elm-make {
    debug true
    warn true
    report json
    yes true
  }
  elm-css {
    root .
    entry src/Stylesheets.elm
    module Stylesheets
    port files
    pathToMake
  }
}
