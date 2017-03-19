const chalk = require('chalk');
const child_process = require('child_process');
const chokidar = require('chokidar');
const compile = require('node-elm-compiler').compile;
const elmCss = require('elm-css');
const express = require('express');
const findElmDependencies = require('find-elm-dependencies').findAllDependencies;
const handlebars = require('handlebars');
const livereload = require('livereload');
const path = require('path');
const proxy = require('http-proxy-middleware');
const request = require('request-promise');
const tmp = require('tmp');

const TEMPLATE = `<!DOCTYPE HTML>
<html>
  <head>
    <meta charset="UTF-8">
    <title>~{{path}}</title>
    <style type="text/css">
      @import url(http://fonts.googleapis.com/css?family=Source+Sans+Pro);
      html, head, body {
        margin: 0;
        height: 100%;
      }
    </style>
    <link rel="stylesheet" href="http://localhost:8000/public/index.css">
  </head>
  <body>
    <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #9A9A9A; font-family: &#39;Source Sans Pro&#39;;">
      <div style="font-size: 3em;">Building your project!</div>
      <img src="/_reactor/waiting.gif">
      <div style="font-size: 1em">With new projects, I need a bunch of extra time to download packages.</div>
    </div>
  </body>
  <script src="/_compile{{path}}" charset="utf-8"></script>
  <script>
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild)
    }
    runElmProgram()
  </script>
</html>
`;

const SRC_DIR_PATH = './src';
const STYLESHEET_PATH = './src/Stylesheets.elm';
const template = handlebars.compile(TEMPLATE);
let reactor = null;
let app = null;
let watcher = null;
let lr = null;

const createTmpDir = () => {
  return new Promise(function(resolve, reject) {
    tmp.dir(function(err, tmpDirPath) {
      if (err) {
        reject(err);
      } else {
        resolve(tmpDirPath);
      }
    });
  });
};

const compileCss = (
  entry,
  output,
  module = 'Stylesheets',
  port = 'files',
  root_ = process.cwd(),
  makePath
) => {
  const proc = child_process.spawn(
    `elm-css`,
    [
      entry,
      `--output=${output}`,
      `--module=${module}`,
      `--port=${port}`,
      `--root=${root_}`
    ],
    { stdio: 'inherit' }
  );
};

const onChange = (tmpDirPath, entry) => path => {
  console.log('changed: ', path);

  // compile css
  compileCss(entry, tmpDirPath);

  // close watcher to clear all watcher and file listeners
  watcher.close();

  // re add file on change listener
  watcher.on('change', onChange(tmpDirPath, entry));

  // get new files list and add them them to the watcher
  findElmDependencies(entry).then(files => {
    watcher.add([entry, ...files]);
  });
};

const initWatcher = (tmpDirPath, entry) => {
  findElmDependencies(entry)
    .then(files => {
      watcher = chokidar.watch([entry, ...files], {
        awaitWriteFinish: {
          stabilityThreshold: 500,
          pollInterval: 100
        }
      });

      // add change listeners
      watcher.on('change', onChange(tmpDirPath, entry));
    })
    .catch(err => console.log(chalk.red(err)));
};

const initReactor = () => {
  reactor = child_process.spawn(
    'elm-reactor',
    ['--address=127.0.0.1', '--port=8001'],
    {
      stdio: 'inherit'
    }
  );
};

// init express server
const initExpress = tmpDirPath => {
  app = new express();

  // static file serving
  app.use('/public', express.static(tmpDirPath));

  // setup live reload
  app.use(
    require('connect-livereload')({
      port: 35729
    })
  );

  // custom api proxy to get around cors
  app.use(
    proxy('/api', {
      target: 'http://localhost:8001'
    })
  );

  // handle the /_compile/*.elm files specifically to elm-reactor
  app.use(
    proxy('/_compile', {
      target: 'http://localhost:8001'
    })
  );

  // handle other elm files through the template
  app.get('*.elm', (req, res) => {
    res.send(template({ path: req.url }));
  });


  // proxy all other requests to elm-reactor
  app.use(
    proxy({
      target: 'http://localhost:8001'
    })
  );

  app.listen(8000, () => {
    console.log('elm-factory listening on port 8000!');
  });
};

const initLiveReload = (host, port, tmpDirPath) => {
  lr = livereload.createServer({
    originalPath: `${host}:${port}`
  });
  lr.watch('./src');
};

function init(srcDirPath, stylesheetPath) {
  createTmpDir().then(tmpDirPath => {
    // compileCss(stylesheetPath, tmpDirPath);
    initReactor();
    initExpress(tmpDirPath);
    initWatcher(tmpDirPath, stylesheetPath);
    // initLiveReload(tmpDirPath, 'http://localhost', 8000);
  });
}

init(SRC_DIR_PATH, STYLESHEET_PATH);

/* MAKE SURE WE KILL CHILD PROCESSES */

// regular exist
process.on('exit', code => {
  reactor && process.kill(reactor.pid + 1)
  console.log('Exited with code', code)
  process.exit(code);
});

// ctrl+c
process.on('SIGINT', () => {
  process.exit(0);
});

// uncaught exception
process.on('uncaughtException', err => {
  process.exit(1);
});
