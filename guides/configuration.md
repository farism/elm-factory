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
    "template": "",
    "outputPath": "",
    "publicPath": ""
  },
  "dev": {
    "main": "",
    "stylesheets": "",
    "template": "",
    "host": "",
    "port": "",
    "reactorHost": "",
    "reactorPort": ""
  }
}
```

## Example
```json
{
  "main": "./src/MyApp.elm",
  "stylesheets": "./src/Styles.elm",
  "build": {
    "template": "./src/index.prod.ejs",
    "outputPath": "./dist",
    "publicPath": "http://somecdn.com"
  },
  "dev": {
    "main": "./src/Sandbox.elm",
    "template": "./src/index.dev.ejs",
    "port": "3000"
  }
}
```
