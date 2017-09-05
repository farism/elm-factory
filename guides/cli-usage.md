# CLI

### Usage

```
$ elm-factory

Commands:
  build [options]  builds an elm-factory project for production
  dev [options]    starts elm-factory in dev mode
  init [dir]       initializes a boilerplate elm-factory application

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

### init

```
$ elm-factory init --help

elm-factory init [dir]

Options:
  --version    Show version number                                     [boolean]
  --help       Show help                                               [boolean]
  --dir        the project directory                                  [required]
  -f, --force  ignore existing files                            [default: false]
```

### build

```
$ elm-factory build --help

elm-factory build [options]

Options:
  --version          Show version number                               [boolean]
  --help             Show help                                         [boolean]
  -m, --main         main entry file                 [default: "./src/Main.elm"]
  -s, --stylesheets  stylesheets entry file   [default: "./src/Stylesheets.elm"]
  -t, --html         optional html template file        [default: "./index.ejs"]
  -o, --output-path  output directory                         [default: "build"]
  -p, --public-path  absolute path for static assets               [default: ""]
  -a, --asset-tag    the tag to use for extracting assets  [default: "AssetUrl"]
  --minify           minify the *.css and *.js files             [default: true]
```

### dev

```
$ elm-factory dev --help


elm-factory dev [options]

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
