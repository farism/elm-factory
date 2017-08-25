# Advanced

Elm Factory is essentially a CLI tool that is a thin wrapper over a few core libraries while exposing additional functionality.

The tasks themselves are orchestrated using [gulp](https://gulpjs.com/), and a handful of plugins. These plugins include:

- [`gulp-elm`](https://github.com/philopon/gulp-elm) - a wrapper around node-elm-compiler
- [`gulp-elm-find-dependencies`](https://github.com/farism/gulp-elm-find-dependencies) - a wrapper around elm-find-dependencies
- [`gulp-elm-css`](https://github.com/farism/gulp-elm-css) - a wrapper around elm-css
- [`gulp-elm-extract-assets`](https://github.com/farism/gulp-elm-extract-assets) - a custom plugin for extracting tagged assets from a compiled Elm application
- [`gulp-postcss`](https://github.com/postcss/gulp-postcss) - a wrapper around postcss

And a few others. However, the above are the core plugins that are used for the `dev` and `build` tasks. If one was feeling adventurous they could easily use these plugins to create their own build - or dev - pipelines.

Here is a quick example of the `build-css` gulp task in `elm-factory`:

```js
gulp.task('build-css', () =>
  pump(
    gulp.src(stylesheets),
    elmCss(),
    postcss([
      url({
        url: 'copy',
        basePath: path.resolve('./'),
        assetsPath: path.resolve(outputPath),
        useHash: true,
        hashOptions: {
          method: getHash,
        },
      }),
      url({
        url: asset => getPublicPath(asset.url),
      }),
      cssnano(),
    ]),
    rev.revision({
      fileNameManifest: 'css-manifest.json',
      transformFilename,
    }),
    gulp.dest(outputPath),
    rev.manifestFile(),
    gulp.dest(outputPath)
  )
)
```
