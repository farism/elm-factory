const chalk = require('chalk');
const child_process = require('child_process');
const chokidar = require('chokidar');
const elmCss = require('elm-css');
const express = require('express');
const findElmDependencies = require('find-elm-dependencies').findAllDependencies;
const handlebars = require('handlebars');
const livereload = require('livereload');
const path = require('path');
const proxy = require('http-proxy-middleware');
const request = require('request-promise');
const tmp = require('tmp');

const MAIN_ENTRY = './src/elm/HelloWorld.elm';
const STYLESHEET_ENTRY = './src/elm/Stylesheets.elm';
const WATCHER_OPTS = {
  awaitWriteFinish: {
    stabilityThreshold: 500,
    pollInterval: 100
  }
};
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

const compileCss = (
  entry,
  output,
  module = 'Stylesheets',
  port = 'files',
  root_ = process.cwd(),
  makePath
) => {
  return elmCss(root_, entry, output, module, port, makePath);
};

const initLiveReload = (tmpDirPath, host, port) => {
  const lr = livereload.createServer({
    originalPath: `${host}:${port}`,
    // debug: true,
  });

  lr.watch(tmpDirPath);

  return lr;
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

  const template = handlebars.compile(TEMPLATE);

  app.get('*.elm', [
    // do live reload on
    require('connect-livereload')({
      port: 35729,
      include: [/(.)*\.elm/]
    }),
    // handle with template
    (req, res) => {
      res.send(template({ path: req.url }));
    }
  ]);

  // proxy all other requests to elm-reactor
  app.use(
    proxy({
      target: 'http://localhost:8001'
    })
  );

  app.listen(8000, () => {
    console.log('elm-factory listening on port 8000!');
  });

  return app;
};

const initWatchers = (lr, tmpDirPath, mainEntry, stylesheetEntry, opts) => {
  const resetWatcher = (entry, watcher, onChange) => {
    // get new files list
    findElmDependencies(entry).then(files => {
      // close watcher to clear all listeners
      watcher.close();

      // re add file on change listener
      watcher.on('change', onChange);

      // and entry and files to the watcher
      watcher.add([entry, ...files]);
    });
  };

  const onChangeMainTree = (stylesheetWatcher, mainWatcher, entry) => file => {
    // console.log('changed main tree: ', file);

    const stylesheets = Object.values(stylesheetWatcher.getWatched()).reduce(
      (acc, cur) => [...acc, ...cur],
      []
    );

    // don't trigger hard refresh for stylesheet tracked files
    if (!stylesheets.includes(path.basename(file))) {
      // reset the main watcher
      resetWatcher(
        entry,
        mainWatcher,
        onChangeMainTree(stylesheetWatcher, mainWatcher, entry)
      );

      // trigger livereload
      lr.refresh(file);
    }
  };

  const onChangeStylesheetTree = (tmpDirPath, watcher, entry) => file => {
    // console.log('changed stylesheet tree: ', file);

    // compile css and trigger livereload
    compileCss(entry, tmpDirPath).then(() => {
      resetWatcher(
        entry,
        watcher,
        onChangeStylesheetTree(tmpDirPath, watcher, entry)
      );

      lr.filterRefresh(file);
    });
  };

  // build from dependency trees watchers
  findElmDependencies(stylesheetEntry)
    .then(files => {
      const stylesheetWatcher = chokidar.watch(
        [stylesheetEntry, ...files],
        opts
      );

      stylesheetWatcher.on(
        'change',
        onChangeStylesheetTree(tmpDirPath, stylesheetWatcher, stylesheetEntry)
      );

      findElmDependencies(mainEntry)
        .then(files => {
          mainWatcher = chokidar.watch([mainEntry, ...files], opts);

          mainWatcher.on(
            'change',
            onChangeMainTree(stylesheetWatcher, mainWatcher, mainEntry)
          );
        })
        .catch(err => console.log(chalk.red(err)));
    })
    .catch(err => console.log(chalk.red(err)));
};

function init(mainEntry, stylesheetEntry, watcherOpts) {
  // create a tmp dir to serve assets from
  tmp.dir(function(err, tmpDirPath) {
    if (err) {
      console.error(chalk.red(err));
    } else {
      // initial compile of assets
      compileCss(stylesheetEntry, tmpDirPath).then(() => {
        // start processes
        const lr = initLiveReload(tmpDirPath, 'http://localhost', 8000);
        const reactor = initReactor();
        const app = initExpress(tmpDirPath);
        initWatchers(lr, tmpDirPath, mainEntry, stylesheetEntry, watcherOpts);
        handleExit(lr, reactor);
      });
    }
  });
}

init(MAIN_ENTRY, STYLESHEET_ENTRY, WATCHER_OPTS);

/* MAKE SURE WE KILL CHILD PROCESSES */

const handleExit = (lr, reactor) => {
  // regular exist
  process.on('exit', code => {
    console.log('Exited with code', code);
    reactor && process.kill(reactor.pid);
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
};
