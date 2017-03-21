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
  - always read from elm-factory.json, merge with commander/index.js defaults?
  - if cli args specified, merge over elm-factory.json?
