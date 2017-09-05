# Building for production

```
$ elm-factory build [options]

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

A common challenging question many web deployed projects eventually face is "how do I deploy all this stuff?". There are many solutions, and there is no silver bullet.

Webpack is the most popular solution but some find it fatiguing to go through the loopholes of setting up and maintaining all of the proper configurations for the different environments

Elm Factory `build` strives to provide a predictable and sensible build system. It's not perfect yet as it has not tackled many use cases, but it works fairly well out of the box.

Inspiration was taken from [elm-asset-path](https://github.com/NoRedInk/elm-asset-path) and [elm-assets-loader](https://github.com/NoRedInk/elm-assets-loader) for the approach in tagging and extracting assets from `*.elm` files. It would be great to have something similar to elm-asset-path as a standalone project but without the native dependency.

## Assets

_In all cases, external `http://*` and inlined `data:*` urls are ignored_

#### Main

Using the `--asset-tag` option (defaults to `AssetUrl`), assets are parsed/extracted from matched `<AssetTag>` paths. Assets will be cache busted by their contents, and then copied to the `--output-path` directory.

#### Stylesheets

Assets are parsed/extracted from matched `url(...)` styles in the generated files `*.css` files. Assets will be cache busted by their contents, and then copied to the `--output-path` directory.

## Serving from a remote url with `--public-path`

If you plan to serve your assets from some remote url like S3 or a CDN, you have the option to pass a `--public-path`. In both the generated `*.js` and `*.css` files, all assets will be prepended with this path.

## Disabling minification with `--no-minify`

Minification is turned on by default. UglifyJS and cssnano are used to minify the resulting bundles. However, minification can be turned off with the `--no-minify` flag.

## Templating

Please see the [`templating`]() guide for more information
