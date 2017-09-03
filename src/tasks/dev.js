const anyTemplate = require('gulp-any-template')
const browserSync = require('browser-sync')
const check = require('check-types')
const elmCss = require('elm-css')
const execa = require('execa')
const findAllDependencies = require('find-elm-dependencies').findAllDependencies
const fkill = require('fkill')
const fs = require('fs')
const nocache = require('nocache')
const path = require('path')
const proxy = require('http-proxy-middleware')
const tmp = require('tmp')

const defaults = require('../defaults').dev
const {
  exists,
  initializeSpinner,
  installPackages,
  validateParam,
} = require('./utils')

// global reference to CLI spinner
const spinner = initializeSpinner()

// global reference to current stylesheet deps
let stylesheetsDeps

const parseProxies = (delimiter, proxies) => {
  validateParam('array', 'proxies', proxies)
  check.assert.array.of.string(proxies)

  return proxies.reduce((acc, proxy) => {
    if (proxy.includes(delimiter)) {
      const arr = proxy.split(delimiter)
      acc.push({ from: arr[0], target: arr[1] })
    }

    return acc
  }, [])
}

const createProxies = (rewrite = true, proxies) => {
  validateParam('array', 'proxies', proxies)
  check.assert.array.of.object(proxies)

  return proxies.map(({ from, target }) =>
    proxy(from, {
      target,
      pathRewrite: (path, req) => (rewrite ? path.replace(from, '') : path),
      logLevel: 'silent',
    })
  )
}

const getDepTree = entry => {
  validateParam('string', 'entry', entry)

  return findAllDependencies(entry).then(deps => [entry, ...deps])
}

const loadHtmlCompiler = file => {
  validateParam('string', 'file', file)

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

const htmlCompiler = (bs, html) => (request, response, next) => {
  if (path.extname(request.url) === '.elm') {
    return loadHtmlCompiler(html)
      .catch(e => {
        spinner(e)
      })
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
        throw e
      })
      .then(() =>
        createWatcher(
          () => bs.reload(),
          () => {},
          dep => !stylesheetsDeps.includes(dep),
          bs,
          path.join(process.cwd(), request.url)
        )
      )
  } else {
    next()
  }
}

const startReactor = (
  host,
  port,
  /* istanbul ignore next */
  exitParent = true
) => {
  validateParam('string', 'host', host)
  validateParam('number', 'port', port)

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

    reactor.stderr.on('data', data => {
      reactor.stderr.on('data', () => {})
      if (data.toString().includes('Address already in use')) {
        reject({ close, message: data.toString() })
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
  proxies,
  proxyRewrite = true,
  logLevel = 'silent'
) => {
  validateParam('string', 'host', host)
  validateParam('number', 'port', port)
  validateParam('string', 'reactor', reactor)
  validateParam('string', 'html', html)
  validateParam('string', 'dir', dir)
  validateParam('array', 'proxies', proxies, false)
  validateParam('boolean', 'proxyRewrite', proxyRewrite, false)

  return new Promise((resolve, reject) => {
    const bs = browserSync.create('server')

    const customProxies = proxies
      ? createProxies(proxyRewrite, parseProxies('=', proxies))
      : []

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
          ...customProxies,
          nocache(),
          proxy('/_compile', { target: reactor, logLevel }),
          htmlCompiler(bs, html),
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
  validateParam('function', 'onChange', onChange)
  validateParam('function', 'onDeps', onDeps)
  validateParam('function', 'filter', filter)
  validateParam('object', 'bs', bs)
  validateParam('string', 'entry', entry)

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

const compileCss = (stylesheets, dir) =>
  elmCss(process.cwd(), stylesheets, dir)
    .then(() => {
      setTimeout(() => {
        spinner.space()
        spinner.succeed('css has been compiled')
        spinner.space()
      })
    })
    .catch(e => {
      setTimeout(() => {
        spinner.space()
        spinner.fail(`elm-css ${e.message}`, false)
        spinner.space()
      })
    })

const dev = options => {
  const opts = Object.assign({}, defaults, options)
  const tmpDir = tmp.dirSync({ unsafeCleanup: true })

  spinner.next('elm-package install is starting')

  return (
    // first install packages using elm-package
    installPackages()
      .catch(e => {
        spinner.fail(e)
      })
      // then start elm-reactor
      .then(output => {
        spinner.succeed('elm-package install has completed')
        spinner.next('elm-reactor is starting')

        return startReactor(opts.reactorHost, opts.reactorPort)
      })
      // then start browser-sync
      .then(() => {
        spinner.succeed('elm-reactor is now started')
        spinner.next('browser-sync is starting')

        return startBrowserSync(
          opts.host,
          opts.port,
          `http://${opts.reactorHost}:${opts.reactorPort}`,
          opts.html,
          tmpDir.name,
          opts.proxy,
          opts.proxyRewrite
        ).catch(e => {
          spinner.fail(e)
        })
      })
      .then(({ bs, port }) => {
        spinner.succeed('browser-sync is now started')

        return Promise.all([
          Promise.resolve(port),
          // check if our stylesheet exists
          exists(opts.stylesheets)
            .then(() => {
              // compile stylesheet
              spinner.next('css is now compiling')

              return compileCss(opts.stylesheets, tmpDir.name)
            })
            .then(() => {
              // create stylesheet watcher
              return createWatcher(
                file => compileCss(opts.stylesheets, tmpDir.name),
                deps => (stylesheetsDeps = deps),
                () => true,
                bs,
                opts.stylesheets
              )
            })
            .catch(e => {
              spinner.space()
              spinner.fail(e, false)
            }),
        ])
      })
      .then(port => {
        spinner.succeed(`ready! http://${opts.host}:${opts.port}`)
        spinner.space()
      })
      .catch(e => {
        spinner.fail(e, false)
        spinner.space()
        throw e
      })
  )
}

module.exports = {
  parseProxies,
  createProxies,
  getDepTree,
  loadHtmlCompiler,
  startReactor,
  startBrowserSync,
  createWatcher,
  dev,
}
