const chalk = require('chalk')
const check = require('check-types')
const execa = require('execa')
const fs = require('fs')
const ora = require('ora')

const spacer = (count = 50) => '-'.repeat(count)

const invalidParam = (type, name) =>
  `parameter \`${name}\` expected \`${type}\``

const validateParam = (type, name, value, required = true) => {
  const checker = required ? check.assert : check.assert.maybe

  return checker[type](value, invalidParam(type, name))
}

const exists = path => {
  validateParam('string', 'path', path)

  return new Promise((resolve, reject) => {
    fs.stat(path, (err, contents) => {
      if (err) {
        reject(`could not find ${path}`)
      } else {
        resolve(contents)
      }
    })
  })
}

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

const initializeSpinner = () => {
  const spinner = ora()
  const space = () => spinner.stopAndPersist({ symbol: spacer(), text: ' ' })

  return {
    space,
    next: text => {
      space()
      spinner.text = text
      spinner.start()
    },
    succeed: text => {
      spinner.succeed(text)
    },
    fail: (e, rethrow = true) => {
      spinner.fail((e.message || e).trim())
      if (rethrow) {
        throw e
      }
    },
  }
}

module.exports = {
  invalidParam,
  validateParam,
  spacer,
  exists,
  installPackages,
  initializeSpinner,
}
