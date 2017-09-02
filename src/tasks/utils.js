const chalk = require('chalk')
const check = require('check-types')
const execa = require('execa')

const invalidParam = (type, name) =>
  `parameter \`${name}\` expected \`${type}\``

const validateParam = (type, name, value, required = true) => {
  const checker = required ? check.assert : check.assert.maybe

  return checker[type](value, invalidParam(type, name))
}

const spacer = (count = 50) => '-'.repeat(count)

const installPackages = (cwd = process.cwd()) => {
  validateParam('string', 'cwd', cwd)

  return new Promise((resolve, reject) => {
    let output = ''

    const proc = execa('elm-package', ['install', '--yes'], {
      cwd,
      stdio: 'pipe',
    })

    proc.stdout.on('data', data => (output = data.toString()))
    proc.then(() => resolve(output)).catch(e => reject(e))
  })
}

module.exports = {
  invalidParam,
  validateParam,
  spacer,
  installPackages,
}
