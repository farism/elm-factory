const anyTemplate = require('gulp-any-template')
const browserSync = require('browser-sync')
const check = require('check-types')
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
const { installPackages, spacer, validateParam } = require('./utils')

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

const htmlCompiler = html => (request, response, next) => {
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
          htmlCompiler(html),
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

const watch = (bs, main, stylesheets, dir) => {
  validateParam('object', 'bs', bs)
  validateParam('string', 'main', main)
  validateParam('string', 'stylesheets', stylesheets)
  validateParam('string', 'dir', dir)

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

  // tmp dir for generated files
  const tmpDir = tmp.dirSync({ unsafeCleanup: true })

  // CLI spinner
  const spinner = ora()
  const spinnerSpacer = () =>
    spinner.stopAndPersist({ symbol: spacer(), text: ' ' })
  spinner.text = 'elm-package install is starting`'
  spinner.start()

  // the cli task
  return (
    // first install packages using elm-package
    installPackages()
      .catch(e => {
        spinnerSpacer()
        spinner.fail('elm-package install has failed')
        spinnerSpacer()
        throw e
      })
      // then start elm-reactor
      .then(output => {
        spinnerSpacer()
        spinner.succeed('elm-package install has completed')
        spinnerSpacer()
        spinner.text = 'elm-reactor is starting'
        spinner.start()

        return startReactor(opts.reactorHost, opts.reactorPort)
      })
      // then start browser-sync
      .then(() => {
        spinner.succeed('elm-reactor is now started')
        spinnerSpacer()
        spinner.text = 'browser-sync is starting'
        spinner.start()

        return startBrowserSync(
          opts.host,
          opts.port,
          `http://${opts.reactorHost}:${opts.reactorPort}`,
          opts.html,
          tmpDir.name,
          opts.proxy,
          opts.proxyRewrite
        )
      })
      .then(({ bs, port }) => {
        spinner.succeed('browser-sync is now started')
        spinnerSpacer()
        spinner.text = 'css is now compiling'
        spinner.start()

        return (
          elmCss(process.cwd(), opts.stylesheets, tmpDir.name)
            // then we want to build the css (before we start watching)
            // finally we start watching
            .then(() => {
              spinnerSpacer()
              spinner.succeed('css has been compiled')
              spinnerSpacer()
              spinner.succeed(
                `elm-factory is ready on http://${opts.host}:${port}`
              )
              spinnerSpacer()

              return watch(bs, opts.main, opts.stylesheets, tmpDir.name)
            })
        )
      })
      .catch(e => {
        spnner.fail()
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
  watch,
  dev,
}
