const anyTemplate = require('gulp-any-template')
const filter = require('gulp-filter')
const fs = require('fs')
const gulp = require('gulp')
const ora = require('ora')
const path = require('path')
const pumpify = require('pumpify')
const rename = require('gulp-rename')

const { spacer, validateParam } = require('./utils')

const isEmpty = dir => {
  validateParam('string', 'dir', dir)

  return new Promise((resolve, reject) => {
    fs.readdir(dir, function(err, files) {
      resolve(files ? files.length === 0 : true)
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
  const spinnerFail = text => {}
  spinner.text = 'initializing your project'
  spinner.start()

  return isEmpty(options.dir)
    .then(empty => {
      if (options.force || empty) {
        return copy(options.dir).catch(e => {
          spinnerSpacer()
          spinner.fail(e)
          spinnerSpacer()
          throw e
        })
      } else {
        spinnerSpacer()
        spinner.fail('directory already exists and has children')
        spinnerSpacer()
        throw new Error()
      }
    })
    .then(() => {
      spinnerSpacer()
      spinner.succeed(`project created!`)
      spinnerSpacer()
      spinner.stopAndPersist({ symbol: '$ ', text: `cd ${options.dir}` })
      spinnerSpacer()
    })
}

module.exports = {
  isEmpty,
  copy,
  init,
}
