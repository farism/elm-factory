# The dev server

```
$ elm-factory dev [options]

Options:
  --version           Show version number                              [boolean]
  --help              Show help                                        [boolean]
  -s, --stylesheets   stylesheets entry file  [default: "./src/Stylesheets.elm"]
  -t, --html          html template file                [default: "./index.ejs"]
  -h, --host          dev server address                  [default: "127.0.0.1"]
  -p, --port          dev server port                            [default: 8000]
  -r, --reactor-host  elm-reactor address                 [default: "127.0.0.1"]
  -u, --reactor-port  elm-reactor port                           [default: 8001]
  -x, --proxy         additional proxies                           [default: []]
  --proxy-rewrite     rewrite proxy paths                        [default: true]
```

## The stylesheet entry point

When using `elm-factory init` a file named `./src/Stylesheets.elm` will scaffolded. This file is the default used for the `elm-factory dev --stylesheet` flag.

This file imports the other stylesheet files from your application, and is used by [`elm-css`](https://github.com/rtfeldman/elm-css) to generate the css files. Please read the `elm-css` documentation for more information. It's a seriously awesome library, and trying to make using it a seamless experience was one of the primary motivations behind this project.

## Proxying

#### Configuration

Sometimes you want to be able to make requests to another server, like making api calls. This is usually something that is a bit tricky to setup because a path change in development can mess up something when going to deploy. This is where proxies come in.

`--proxy` can configure multiple proxy endpoints. For example:

`--proxy /api=localhost:3000/api/v2 --proxy /some-path=http://google.com`

_*note, you MUST use `=` as the delimiter_

#### Rewriting

Assuming Elm Factory is running on `http://localhost:8000`, by default, the proxy request path will be rewritten as follows:

fetch:

`http://localhost:8000/api/users.json`,

the underlying proxy request will be:

`http://localhost:3000/api/v2/users.json`.

`--no-proxy-rewrite` can disable this functionality, in which case the resulting request would have been:

`http://localhost:3000/api/api/v2/users.json`.

## Templating

Please see the [`templating`]() guide for more information

## File watching

Elm Factory uses [`find-elm-dependencies`](https://github.com/noredink/find-elm-dependencies) to build the import tree for watching. Each time a file in the tree is changed, the old watcher is closed and a new file tree will be created and watched. This could potentially be a bit slow on very large projects, but this ensures always having an accurate import tree.

#### Watching the main application

When navigating to an `*.elm` file, the dev server will use the current file as the entry point for watching. Each time a file is changed, `livereload` will trigger a hard refresh and elm-reactor will recompile the application. Hopefully we can get hotreloading working eventually!

#### Watching stylesheets

When the dev server starts up, it will watch the `--stylesheet` file and use it as the entry point for file watching. Each time a file is changed, `elm-css` will be ran on the `--stylesheet` entry file to regenerate all of the raw `*.css` files. These are stored in a `tmp` directory somewhere, and the dev server will inject this css with livereload without a browser refresh.

### Browsersync
Elm Factory uses the excellent [`Browsersync`](https://browsersync.io/) as its development server. Browsersync is built on express, and has all of the features necessary to build a full featured experience: `livereload`, `watching`, `proxies`, etc. In addition to this it comes integrated with the [`Browsersync UI`](https://github.com/browsersync/UI) which allows you to seamlessly test across devices.
