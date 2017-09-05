#### 0.7.0
#### Elm Factory has an official domain now! http://elm-factory.io/
###### changes
- removed `--main` option from `dev` command. Files are now watched when you browse to them
- added `--proxy` option to `dev` command
- added `--proxy-rewrite` option to `dev` command
- added `--minify` option to `build` command
- added `--asset-tag` option to `build` command
- `build` now generates an index.html file
- better output overall
- added ora for pretty spinners!!
- spinners!
- spinners!!!

###### bug fixes
- `init` and `build` commands now work with absolute paths
- fixed messaging when tasks break

#### 0.6.0
- better elm-reactor process management
- express > browser-sync
- gulp-elm > gulp-elm-basic
- browser-sync/chokidar for watching instead of gulp/gaze
- more spec coverage

#### 0.4.0

- add uglify to the build-main pipeline

#### 0.3.2

- the dev template file generated with init now uses an absolute css path

#### 0.3.1

- temporarily remove the html build task
