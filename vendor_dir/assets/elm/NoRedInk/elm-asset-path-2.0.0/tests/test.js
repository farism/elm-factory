import test from 'ava';
import chalk from 'chalk';
import jsdomify from 'jsdomify';

const hot_require = path => {
  delete require.cache[require.resolve(path)];
  return require(path);
}

/* Taken from rtfeldman/node-test-runner */

// Fix Windows Unicode problems. Credit to https://github.com/sindresorhus/figures for the Windows compat idea!
const windowsSubstitutions = [[/[↓✗►]/g, '>'], [/╵│╷╹┃╻/g, '|'], [/═/g, '='],, [/▔/g, '-'], [/✔/g, '√']];

function windowsify(str) {
  return windowsSubstitutions.reduce(
    function(result, sub) { return result.replace(sub[0], sub[1]); }, str);
}

function chalkify(messages) {
  return messages.map(function(msg) {
    var path = msg.styles;
    var text = process.platform === 'win32' ? windowsify(msg.text) : msg.text;

    if (path.length === 0) {
      return text;
    } else {
      var fn = chalk;

      path.forEach(function(nextPath) { fn = fn[nextPath]; });

      return fn(text);
    }
  }).join('');
}

const runElmTest = (t, module) => {
  // hardcoded flags equivalent to:
  // https://github.com/rtfeldman/node-test-runner/blob/348ef6d38884834706cb2052f73bb253af73a8cf/bin/elm-test#L176
  const flags = {seed: "0", report: "chalk"};
  const app = module.worker(flags);
  app.ports.emit.subscribe(msg => {
    const msgType = msg[0];
    const data = msg[1];

    if (msgType === 'FINISHED') {
      const message = chalkify(data.message);
      if (data.exitCode !== 0) {p
        t.fail(message);
      } else {
        t.pass(message);
      }
      t.end();
    } else if (msgType === "TEST_COMPLETED")  {
      console.log(chalkify(data));
    }
  });
}

const documentWithMeta = assetsRootUrl => {
  return `<!DOCTYPE html>
    <html>
      <head>
        <meta name="assets-root-url" content="${assetsRootUrl}">
      </head>
      <body>
        hello<
      /body>
    </html>`;
}

/* now the tests */

test.beforeEach(t => {
  jsdomify.clear();
});

test.cb("without assets-root-url", t => {
  jsdomify.create();
  const no_root_url_test = hot_require('./build/no_root_url_test.js');
  runElmTest(t, no_root_url_test.NoRootUrlTest);
});

test.cb("with assets-root-url with trailing slash", t => {
  jsdomify.create(documentWithMeta('https://cdn.elm-lang.org/'));
  const with_root_url_test = hot_require('./build/with_root_url_test.js');
  runElmTest(t, with_root_url_test.WithRootUrlTest);
});

test.cb("with assets-root-url with no trailing slash", t => {
  jsdomify.create(documentWithMeta('https://cdn.elm-lang.org'));
  const with_root_url_test = hot_require('./build/with_root_url_test.js');
  runElmTest(t, with_root_url_test.WithRootUrlTest);
});
