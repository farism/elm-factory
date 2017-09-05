# Configuration

Each CLI option is available is a configuration option. Shared options may be declared at the root level of the configuration object.

## All options
```json
{
  "main": "",
  "stylesheets": "",
  "template": "",
  "build": {
    "main": "",
    "stylesheets": "",
    "html": "",
    "outputPath": "",
    "publicPath": ""
  },
  "dev": {
    "main": "",
    "stylesheets": "",
    "html": "",
    "host": "",
    "port": "",
    "reactorHost": "",
    "reactorPort": "",
  }
}
```

## Example
```json
{
  "stylesheets": "./src/Styles.elm",
  "build": {
    "main": "./src/MyApp.elm",
    "html": "./src/index.prod.ejs",
    "outputPath": "./dist",
    "publicPath": "http://somecdn.com",
  },
  "dev": {
    "html": "./src/index.dev.ejs",
    "port": "3000",
  }
}
```
