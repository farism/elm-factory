const check = require('check-types')
const execa = require('execa')
const ora = require('ora')

const spacer = (count = 50) => '-'.repeat(count)

const invalidParam = (type, name) =>
  `parameter \`${name}\` expected \`${type}\``

const validateParam = (
  type,
  name,
  value,
  required = true,
  prototype = Object.prototype
) => {
  const checker = required ? check.assert : check.assert.maybe

  return checker[type](value, invalidParam(type, name))
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

const initializeSpinner = spinner => {
  const inner = spinner || ora()
  const space = () => inner.stopAndPersist({ symbol: spacer(), text: ' ' })

  return {
    inner,
    space,
    next: text => {
      inner.text = text
      inner.start()
    },
    succeed: text => {
      inner.succeed(text)
      space()
    },
    warn: text => {
      inner.warn(text)
      space()
    },
    fail: (e, rethrow = true) => {
      inner.fail((e.message || e).trim())
      if (rethrow) {
        throw e
      }
      space()
    },
    stopAndPersist: opts => {
      inner.stopAndPersist(opts)
      space()
    },
  }
}

module.exports = {
  invalidParam,
  validateParam,
  spacer,
  installPackages,
  initializeSpinner,
}
