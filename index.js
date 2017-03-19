const fs = require('fs');
const child_process = require('child_process');
const path = require('path');
const tmp = require('tmp');
const chokidar = require('chokidar');
const express = require('express');
const request = require('request-promise');
const proxy = require('http-proxy-middleware');
const compile = require('node-elm-compiler').compile;
const handlebars = require('handlebars');
const livereload = require('livereload');
const findElmDependencies = require('find-elm-dependencies').findAllDependencies;
const elmCss = require('elm-css');
const chalk = require('chalk');

const ENTRY = './src/Stylesheets.elm';
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
  const start = new Date().getTime();
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
  compileCss(ENTRY, tmpDirPath);

  // close watcher to clear all watcher and file listeners
  watcher.close();

  // readd on file change listener
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
  child_process.spawn('elm-reactor', ['--address=127.0.0.1', '--port=8001'], {
    stdio: 'inherit'
  });
};

// init express server
const initExpress = tmpDirPath => {
  app = new express();

  app.use('/public', express.static(tmpDirPath));

  app.use(
    proxy('/api', {
      target: 'http://localhost:8001'
    })
  );

  app.use(
    proxy('/_compile', {
      target: 'http://localhost:8001'
    })
  );

  app.use(
    proxy({
      target: 'http://localhost:8001'
    })
  );

  app.get('*.elm', (req, res) => {
    res.send(fs.readFileSync('index.html').toString());
  });

  app.listen(8000, () => {
    console.log('elm-factory listening on port 8000!');
  });
};

const initLiveReload = () => {
  lr = livereload.createServer();
};

function init(entry) {
  createTmpDir().then(tmpDirPath => {
    initReactor();
    initExpress(tmpDirPath);
    initWatcher(tmpDirPath, entry);
    // initLiveReload();
    compileCss(entry, tmpDirPath)
  });
}

init(ENTRY);

/* HANDLE EXITING */

// regular exist
process.on('exit', code => {
  reactor && reactor.kill('SIGINT');
  process.exit(code);
});

// ctrl+c
process.on('SIGINT', () => {
  reactor && reactor.kill('SIGINT');
  process.exit(0);
});

// uncaught exception
process.on('uncaughtException', err => {
  reactor && reactor.kill('SIGINT');
  process.exit(1);
});
