const anyTemplate = require('gulp-any-template')
const browserSync = require('browser-sync')
const chalk = require('chalk')
const elmCss = require('elm-css')
const execa = require('execa')
const findAllDependencies = require('find-elm-dependencies').findAllDependencies
const fkill = require('fkill')
const fs = require('fs')
const nocache = require('nocache')
const ora = require('ora')
const path = require('path')
const proxy = require('http-proxy-middleware')
const tmp = require('tmp')

const defaults = require('../defaults').dev
const addTask = require('./').addTask

const spacer = () => console.info(`${chalk.grey('-'.repeat(50))}`)

const param = (type, name, value) => {
  const typeErr = `parameter \`${name}\` must be a \`${type}\``

  if (typeof value === 'undefined' || value === null) {
    throw new TypeError(`parameter \`${name}\` is required`)
  }

  if (type === 'object') {
    if (typeof value !== type || Array.isArray(value)) {
      throw new TypeError(typeErr)
    }
  } else if (type === 'array') {
    if (!Array.isArray(value)) {
      throw new TypeError(typeErr)
    }
  } else if (typeof value !== type) {
    throw new TypeError(typeErr)
  }
}

const getDepTree = entry => {
  param('string', 'entry', entry)

  return findAllDependencies(entry).then(deps => [entry, ...deps])
}

const defaultHtmlCompiler = () =>
  Promise.resolve('incompatible html template...')

const loadHtmlCompiler = file => {
  param('string', 'file', file)

  return new Promise((resolve, reject) => {
    fs.readFile(file, (err, contents) => {
      if (err) {
        reject(err)
      }

      const compiler = anyTemplate.compiler({ path: file, contents })

      if (compiler) {
        resolve(compiler)
      } else {
        reject(new Error('html template format unsupported'))
      }
    })
  })
}

const getSpinner = (steps, spinner) => {
  param('array', 'steps', steps)
  param('object', 'spinner', spinner)

  let current = 0
  spinner.current = () => steps[current]
  spinner.next = (fn = () => {}, succeedCurrent = true) => {
    if (succeedCurrent) {
      spinner.succeed(steps[current])
    }
    if (current + 1 >= steps.length) {
      spinner.stop()
      fn && fn(steps[current])
    } else {
      current = current + 1
      fn && fn(steps[current])
      spinner.start()
    }

    return spinner
  }

  return spinner
}

const installPackages = (cwd = process.cwd()) =>
  new Promise((resolve, reject) => {
    execa('elm-package', ['install', '--yes'], { cwd, stdio: 'inherit' })
      .then(() => resolve())
      .catch(e => reject(e))
  })

const startReactor = (
  host,
  port,
  /* istanbul ignore next */ exitParent = true
) => {
  param('string', 'host', host)
  param('number', 'port', port)

  return new Promise((resolve, reject) => {
    const reactor = execa(
      'elm-reactor',
      [`--address=${host}`, `--port=${port}`],
      { detached: true }
    )

    const close = () => {
      fkill(-reactor.pid, { force: true }).catch(e => {
        console.error('closing elm-reactor failed: ', e)
      })
    }

    const exit = code => {
      close()
      process.exit(code)
    }

    if (exitParent) {
      reactor.on('exit', code => exit(0))
      reactor.on('SIGTERM', () => exit(0))
    }

    process.on('exit', code => exit(code))
    process.on('SIGTERM', () => exit(0))
    process.on('SIGINT', () => exit(0))
    process.on('uncaughtException', e => {
      console.error(e)
      exit(1)
    })

    reactor.stderr.on('data', d => {
      reactor.stderr.on('data', () => {})
      if (d.toString().includes('Address already in use')) {
        reject({ close })
      } else {
        resolve({ close })
      }
    })
  })
}

const startBrowserSync = (
  host,
  port,
  reactor,
  html,
  dir,
  /* istanbul ignore next */ logLevel = 'silent'
) => {
  param('string', 'host', host)
  param('number', 'port', port)
  param('string', 'reactor', reactor)
  param('string', 'html', html)
  param('string', 'dir', dir)

  return new Promise((resolve, reject) => {
    const config = {
      files: [html, `${dir}/*.css`],
      host,
      localOnly: true,
      logLevel,
      notify: false,
      online: false,
      open: false,
      port,
      server: {
        baseDir: dir,
        middleware: [
          nocache(),
          proxy('/_compile', { target: reactor, logLevel }),
          (request, response, next) => {
            if (path.extname(request.url) === '.elm') {
              loadHtmlCompiler(html)
                .then(compiler =>
                  compiler({
                    environment: 'development',
                    request,
                  })
                )
                .then(compiledHtml => {
                  response.write(compiledHtml)
                  response.end()
                })
                .catch(e => {
                  console.log('=============', e)
                  response.write(e)
                  response.end()
                })
            } else {
              next()
            }
          },
          proxy('/', { target: reactor, logLevel }),
        ],
      },
      serveStatic: [
        {
          route: '/public',
          dir,
        },
      ],
    }

    const bs = browserSync.create('server')

    bs.init(config, (err, inited) => {
      if (err) {
        reject(err)
      } else {
        resolve({ bs, port: inited.options.get('port') })
      }
    })
  })
}

const watch = (bs, opts, dir) => {
  let stylesheetsWatcher
  let stylesheetsDeps
  let mainWatcher
  let mainDeps

  const watchCss = () =>
    getDepTree(opts.stylesheets).then(deps => {
      stylesheetsDeps = deps

      return bs.watch(['!elm-stuff', ...deps]).on('change', file => {
        // stop watching temporarily
        stylesheetsWatcher && stylesheetsWatcher.close()

        /// rebuild css
        elmCss(process.cwd(), opts.stylesheets, dir)
          .then(() =>
            // start watching files again
            watchCss().then(watcher => (stylesheetsWatcher = watcher))
          )
          .catch(e =>
            // start watching files again
            watchCss().then(watcher => (stylesheetsWatcher = watcher))
          )
      })
    })

  const watchMain = () =>
    getDepTree(opts.main).then(deps => {
      mainDeps = deps

      return bs.watch(['!elm-stuff', ...deps]).on('change', file => {
        if (!stylesheetsDeps.includes(file)) {
          // stop watching temporarily
          mainWatcher && mainWatcher.close()

          // reload the browser
          bs.reload()

          // start watching again
          watchMain().then(watcher => (mainWatcher = watcher))
        }
      })
    })

  return watchCss()
    .then(watcher => {
      stylesheetsWatcher = watcher

      return watchMain()
    })
    .then(watcher => {
      mainWatcher = watcher

      return watcher
    })
}

const task = options => {
  const opts = Object.assign({}, defaults, options)

  // tmpDir for css output
  const tmpDir = tmp.dirSync({ unsafeCleanup: true })

  // CLI spinner
  const step1 = 'installing elm dependencies into /elm-stuff'
  const step2 = 'starting elm-reactor'
  const step3 = 'starting elm-factory'
  const step4 = 'compiling css'
  const step5 = `ready to go! http://${opts.host}:${opts.port}`
  const spinner = getSpinner(step1, ora({ spinner: 'bouncingBar' }))

  // the cli task
  return (
    // first install packages using elm-package
    installPackages()
      // then start elm-reactor
      .then(() => {
        console.log('')
        spinner.advance(step2)

        return startReactor(opts.reactorHost, opts.reactorPort)
      })
      // then start browser-sync
      .then(() => {
        spinner.advance(step3)

        return startBrowserSync(
          opts.host,
          opts.port,
          `http://${opts.reactorHost}:${opts.reactorPort}`,
          opts.html,
          tmpDir.name
        )
      })
      .then(({ bs, port }) => {
        spinner.spinner().stop()

        return (
          elmCss(process.cwd(), opts.stylesheets, tmpDir.name)
            // then we want to build the css (before we start watching)
            // finally we start watching
            .then(() => {
              spinner.succeed(step4)
              spinner.succeed(
                `elm-factory server started on http://${opts.host}:${port}`
              )
              watch(bs, opts, tmpDir.name)
            })
        )
      })
      .catch(e => {
        // spinner.fail()
        console.error(e)
      })
  )
}

module.exports = {
  spacer,
  param,
  getDepTree,
  defaultHtmlCompiler,
  getSpinner,
  loadHtmlCompiler,
  installPackages,
  startReactor,
  startBrowserSync,
  watch,
  task,
}
