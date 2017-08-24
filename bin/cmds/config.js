const findUp = require('find-up')
const fs = require('fs')

const config = findUp.sync(['.elmfactoryrc', '.elmfactoryrc.json'])

module.exports = config
  ? JSON.parse(fs.readFileSync(config))
  : { build: {}, dev: {} }
