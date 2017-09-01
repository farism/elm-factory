# Advanced

Elm Factory is essentially a CLI tool that is a thin wrapper over a few core libraries while exposing additional functionality.

The build tasks are orchestrated using [gulp](https://gulpjs.com/) and a handful of plugins. These plugins include:

- [`gulp-elm-basic`](https://github.com/farism/gulp-elm-basic) - a wrapper around node-elm-compiler
- [`gulp-elm-css`](https://github.com/farism/gulp-elm-css) - a wrapper around elm-css
- [`gulp-elm-extract-assets`](https://github.com/farism/gulp-elm-extract-assets) - a gulp plugin for extracting assets from a compiled Elm application
- [`gulp-postcss`](https://github.com/postcss/gulp-postcss) - a wrapper around postcss

If one was feeling adventurous they could easily use these plugins to create their own build - or dev - pipelines.

Here is a quick example of the `build-css` gulp task in `elm-factory`:

```js
gulp.task('build-css', () =>
  gulp.src(stylesheets)
    .pipe(elmCss())
    .pipe(postcss([
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
    ]))
    .pipe(rev.revision({
      fileNameManifest: 'css-manifest.json',
      transformFilename,
    }))
    .pipe(gulp.dest(outputPath))
    .pipe(rev.manifestFile())
    .pipe(gulp.dest(outputPath))
)
```
