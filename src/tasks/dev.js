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

const installPackages = (cwd = process.cwd()) => {
  param('string', 'cwd', cwd)

  return new Promise((resolve, reject) => {
    execa('elm-package', ['install', '--yes'], { cwd, stdio: 'inherit' })
      .then(() => resolve())
      .catch(e => reject(e))
  })
}

const startReactor = (
  host,
  port,
  /* istanbul ignore next */
  exitParent = true
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
  logLevel = 'silent'
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

const createWatcher = (onChange, onDeps, filter, bs, entry) => {
  param('function', 'onChange', onChange)
  param('function', 'onDeps', onDeps)
  param('function', 'filter', filter)
  param('object', 'bs', bs)
  param('string', 'entry', entry)

  return new Promise((resolve, reject) =>
    getDepTree(entry)
      .then(deps => {
        onDeps(deps)

        const watcher = bs.watch(['!elm-stuff', ...deps])

        watcher.on('change', file => {
          if (filter(file)) {
            // stop watching temporarily
            watcher && watcher.close()

            // trigger on change
            onChange(file)

            // start watching again
            createWatcher(onChange, onDeps, filter, bs, entry)
          }
        })

        resolve(watcher)
      })
      .catch(reject)
  )
}

const watch = (bs, main, stylesheets, dir) => {
  param('object', 'bs', bs)
  param('string', 'main', main)
  param('string', 'stylesheets', stylesheets)
  param('string', 'dir', dir)

  let stylesheetsDeps

  return Promise.all([
    // main watcher
    createWatcher(
      () => bs.reload(),
      () => {},
      dep => !stylesheetsDeps.includes(dep),
      bs,
      main
    ),
    // stylesheets watcher
    createWatcher(
      file => elmCss(process.cwd(), stylesheets, dir),
      deps => (stylesheetsDeps = deps),
      () => true,
      bs,
      stylesheets
    ),
  ])
}

const dev = options => {
  const opts = Object.assign({}, defaults, options)

  // tmpDir for css output
  const tmpDir = tmp.dirSync({ unsafeCleanup: true })

  // CLI spinner
  const steps = [
    'installing elm dependencies into /elm-stuff',
    'starting elm-reactor',
    'starting elm-factory',
    'compiling css',
  ]

  const spinner = ora({ spinner: 'bouncingBar' })
  spinner.text = steps[0]

  // the cli task
  return (
    // first install packages using elm-package
    installPackages()
      // then start elm-reactor
      .then(() => {
        spinner.succeed(steps[0])
        spacer()
        spinner.text = steps[1]
        spinner.start()

        return startReactor(opts.reactorHost, opts.reactorPort)
      })
      // then start browser-sync
      .then(() => {
        spinner.succeed(steps[1])
        spacer()
        spinner.text = steps[2]
        spinner.start()

        return startBrowserSync(
          opts.host,
          opts.port,
          `http://${opts.reactorHost}:${opts.reactorPort}`,
          opts.html,
          tmpDir.name
        )
      })
      .then(({ bs, port }) => {
        spinner.succeed(steps[2])
        spacer()
        spinner.text = steps[3]
        spinner.start()

        return (
          elmCss(process.cwd(), opts.stylesheets, tmpDir.name)
            // then we want to build the css (before we start watching)
            // finally we start watching
            .then(() => {
              spinner.succeed(steps[3])
              spacer()
              spinner.succeed(`ready to go! http://${opts.host}:${port}`)

              return watch(bs, opts.main, opts.stylesheets, tmpDir.name)
            })
        )
      })
      .catch(e => {
        spinner.fail()
        // console.error(e)
        throw new Error(e)
      })
  )
}

module.exports = {
  spacer,
  param,
  getDepTree,
  defaultHtmlCompiler,
  loadHtmlCompiler,
  installPackages,
  startReactor,
  startBrowserSync,
  createWatcher,
  watch,
  dev,
}
