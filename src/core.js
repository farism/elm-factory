const chalk = require('chalk')
const elmCss = require('elm-css')
const fs = require('fs-extra')
const handlebars = require('handlebars')
const path = require('path')
const prettyMs = require('pretty-ms')

const ELM_PACKAGE_NAME = 'elm-package.json'

const defaults = {
  main: './src/Main.elm',
  stylesheets: './src/Stylesheets.elm',
  template: './node_modules/elm-factory/lib/index.hbs',
}

const colors = {
  startup: chalk.bold.magentaBright,
  ready: chalk.bold.yellow,
  files: chalk.bold.cyan,
  error: chalk.bold.red,
}

function compileCss(
  output,
  entry,
  module = 'Stylesheets',
  port = 'files',
  root_ = process.cwd(),
) {
  const t = new Date()
  console.info(colors.files(`[Stylesheets:compile:start] ${entry}`))
  return new Promise((resolve, reject) => {
    elmCss(root_, entry, output, module, port)
      .then(() => {
        console.info(
          colors.files(`[Stylesheets:compile:done] ${entry} ${getElapsed(t)}`),
        )
        resolve()
      })
      .catch(e => {
        console.error(colors.error(`[Stylesheets:compile:fail] ${entry}`))
        reject(e)
      })
  })
}

function getElapsed(start) {
  const str = start
    ? `(${prettyMs(new Date().getTime() - start.getTime())})`
    : ''

  return chalk.dim(str)
}

function loadTemplate(template) {
  return new Promise((resolve, reject) => {
    fs.readFile(template, 'utf8', (err, data) => {
      resolve(handlebars.compile(data))
    })
  })
}

function spacer(char = '-', len = 60) {
  console.info(chalk.dim(char.repeat(len)))
}

function validateFile(log, entry) {
  const entryPath = path.join(process.cwd(), entry)

  return fs
    .access(entryPath, 'r')
    .catch(e => console.error(colors.error(`${log} ${entryPath}`)))
}

module.exports = {
  colors,
  compileCss,
  defaults,
  getElapsed,
  loadTemplate,
  spacer,
  validateFile,
}
