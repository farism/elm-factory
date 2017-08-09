const chalk = require('chalk')
const elmCss = require('elm-css')
const fs = require('fs')
const handlebars = require('handlebars')
const path = require('path')
const prettyMs = require('pretty-ms')

const ELM_PACKAGE_NAME = 'elm-package.json'

const colors = {
  startup: chalk.bold.magentaBright,
  ready: chalk.bold.yellow,
  files: chalk.bold.cyan,
  error: chalk.bold.red,
}

async function compileCss(
  output,
  entry,
  module = 'Stylesheets',
  port = 'files',
  root_ = process.cwd(),
) {
  try {
    const t = new Date()
    console.info(colors.files(`[Stylesheet:compile:start] ${entry}`))
    await elmCss(root_, entry, output, module, port)
    console.info(
      colors.files(`[Stylesheet:compile:done] ${entry} ${elapsed(t)}`),
    )
  } catch (e) {
    console.error(colors.error(`[Stylesheet:compile:fail] ${entry}`))
  }
}

function elapsed(start) {
  const str = start
    ? `(${prettyMs(new Date().getTime() - start.getTime())})`
    : ''

  return chalk.dim(str)
}

function spacer(char = '-', len = 60) {
  console.info(chalk.dim(char.repeat(len)))
}

function loadTemplate(template) {
  return new Promise((resolve, reject) => {
    fs.readFile(template, 'utf8', (err, data) => {
      resolve(handlebars.compile(data))
    })
  })
}

async function validateFile(log, entry) {
  return new Promise((resolve, reject) => {
    const entryPath = path.join(process.cwd(), entry)

    fs.access(entryPath, 'r', err => {
      if (err) {
        reject(`${log} ${entryPath}`)
      } else {
        resolve()
      }
    })
  })
}

module.exports = {
  colors,
  compileCss,
  elapsed,
  loadTemplate,
  spacer,
  validateFile,
}
