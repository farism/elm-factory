const findUp = require('find-up')
const fs = require('fs')

const configPath = findUp.sync(['.elmfactoryrc', '.elmfactoryrc.json'])

const fileConfig = configPath ? JSON.parse(fs.readFileSync(configPath)) : {}

const config = {
  main: fileConfig.main,
  stylesheets: fileConfig.stylesheets,
  template: fileConfig.template,
}

module.exports = {
  build: Object.assign({}, config, fileConfig.build),
  dev: Object.assign({}, config, fileConfig.dev),
}
