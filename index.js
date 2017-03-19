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

const extractCss = () => {
  const output = path.join(process.cwd(), 'dist');
  const module = 'Stylesheets';
  const port = 'files';
  const root_ = '';

  // const start = new Date().getTime()

  // child_process.exec(
  //   `elm-css ${ENTRY} -o ${output} -m ${module} -p ${port} -r ${root_}`
  // )

  // console.log(new Date().getTime() - start)
};

const onChange = entry => path => {
  console.log('changed: ', path);

  // extract css
  // extractCss();

  // close watcher to clear all watcher and file listeners
  watcher.close();

  // readd on file change listener
  watcher.on('change', onChange(entry));

  // get new files list and add them them the watcher
  findElmDependencies(entry).then(files => {
    watcher.add([entry, ...newFiles]);
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
      watcher.on('change', onChange(entry));
    })
    .catch(err => console.error(err));
};

const initReactor = () => {
  child_process.spawn('elm-reactor', ['--address=127.0.0.1', '--port=8001']);
};

// init express server
const initExpress = () => {
  app = new express();

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

  app.use(
    proxy('/api', {
      target: 'http://localhost:8001'
    })
  );

  app.get('*.elm', (req, res) => {
    res.send(fs.readFileSync('index.html').toString());
  });

  app.listen(8000, () => {
    console.log('elm-reactor-proxy listening on port 8000!');
  });
};

const initLiveReload = () => {
  lr = livereload.createServer()
}

function init(entry) {
  createTmpDir().then(tmpDirPath => {
    // initExpress(tmpDirPath);
    // initReactor();
    // initLiveReload();
    // initWatcher(entry);
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
