const anyTemplate = require('gulp-any-template')
const filter = require('gulp-filter')
const fs = require('fs')
const gulp = require('gulp')
const ora = require('ora')
const path = require('path')
const pumpify = require('pumpify')
const rename = require('gulp-rename')

const { spacer, validateParam } = require('./utils')

const checkIsEmpty = dir => {
  validateParam('string', 'dir', dir)

  return new Promise((resolve, reject) => {
    fs.readdir(dir, function(err, files) {
      if (files && files.length) {
        reject('directory already exists and has children')
      } else {
        resolve()
      }
    })
  })
}

const copy = dir => {
  validateParam('string', 'dir', dir)

  return new Promise((resolve, reject) => {
    const packageJson = filter(['**/*.json.ejs'], { restore: true })

    pumpify(
      gulp.src([
        path.resolve(__dirname, '../tmpl/boilerplate/**/*'),
        path.resolve(__dirname, '../tmpl/boilerplate/**/.*'),
      ]),
      packageJson,
      anyTemplate({ name: dir.split('/').pop() }),
      rename(path => {
        path.extname = ''
      }),
      packageJson.restore,
      gulp.dest(dir)
    )
      .on('error', reject)
      .on('finish', resolve)
  })
}

const init = (options = {}) => {
  validateParam('object', 'options', options)

  // CLI spinner
  const spinner = ora()
  const spinnerSpacer = () =>
    spinner.stopAndPersist({ symbol: spacer(), text: ' ' })
  spinner.text = 'initializing your project'
  spinner.start()

  return checkIsEmpty(options.dir)
    .catch(e => {
      spinnerSpacer()
      spinner.fail(e)
      spinnerSpacer()
      throw e
    })
    .then(() =>
      copy(options.dir).catch(e => {
        spinnerSpacer()
        spinner.fail(e)
        spinnerSpacer()
        throw e
      })
    )
    .then(() => {
      spinnerSpacer()
      spinner.succeed(`project created!`)
      spinnerSpacer()
      spinner.stopAndPersist({ symbol: '$ ', text: `cd ${options.dir}` })
      spinnerSpacer()
    })
    .catch(e => {})
}

module.exports = {
  checkIsEmpty,
  copy,
  init,
}
