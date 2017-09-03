const anyTemplate = require('gulp-any-template')
const filter = require('gulp-filter')
const fs = require('fs-extra')
const gulp = require('gulp')
const path = require('path')
const pumpify = require('pumpify')
const rename = require('gulp-rename')

const defaults = require('../defaults').init
const { initializeSpinner, validateParam } = require('./utils')

// global reference to CLI spinner
const spinner = initializeSpinner()

const isEmpty = dir => {
  validateParam('string', 'dir', dir)

  return new Promise((resolve, reject) => {
    fs
      .readdir(dir)
      .then(files => {
        resolve(files ? files.length === 0 : true)
      })
      .catch(() => resolve(true))
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

  spinner.space()
  spinner.next('initializing your project')

  return isEmpty(options.dir)
    .then(empty => {
      if (options.force || empty) {
        return copy(options.dir)
      } else {
        throw 'directory already exists and has children'
      }
    })
    .then(() => {
      spinner.succeed('project created!')
      spinner.stopAndPersist({ symbol: '$ ', text: `cd ${options.dir}` })
    })
    .catch(e => {
      spinner.fail(e, false)
    })
}

module.exports = {
  isEmpty,
  copy,
  init,
}
