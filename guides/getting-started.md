# Getting started, in depth

Thanks for trying Elm Factory! The primary goal of this project is to be very simple, by providing a CLI tool with a few simple commands that have sensible defaults set. It is unknown yet whether this will scale to very large projects, but considering how solid and predictable the current state of Elm's tooling is, there is a lot of promise.

## Installing Elm

It is suggested to use a global Elm installation. `elm@0.18.0` is the currently supported version. However, you can install `elm` as a local package as well if you wish.

```sh
$ yarn global add elm
// or
$ npm install -g elm
```

## Installing Elm Factory

It is also suggested, but not mandatory, to use a global Elm Factory installation.

```sh
$ yarn global add elm-factory
// or
$ npm install -g elm-factory
```

## Creating your first project

You can use the `init` command to scaffold your first project. It has one required argument which is the directory in which to create the project. This directory name will also become the name of the project in the `elm-package.json` and `package.json` files.

```sh
$ elm-factory init my-app
$ cd my-app
```

You cannot initialize a project into an existing directory that has contents unless you pass the `--force` flag.

In addition to the two core Elm packages (core and html), the only other elm dependencies installed are:
- [`elm-css`](http://package.elm-lang.org/packages/rtfeldman/elm-css/latest)
- [`elm-css-helpers`](http://package.elm-lang.org/packages/rtfeldman/elm-css-helpers/latest)

Now that your project is created and you are in the project folder...

## Let's start the dev server

```sh
$ elm-factory dev
```

This will start up the Elm Factory dev server on the default port of `8000`. The port can be configured with the `--port` option.

## Poke around

Navigating to your webserver at `http://localhost:8000`, you will see your project directory served to you. This is just `elm-reactor` running under the hood, nothing fancy.. well, it is, because elm-reactor is really cool!

Once you browse to `/src/Main.elm`, you will see your application be compiled and then you should be seeing the basic scaffold project.

At this point, you are seeing your custom `index.ejs` template being rendered out. The application compilation of the script tag is then being handed off to elm-reactor.

## Edit some files

If you go and edit `src/MainCss.elm`, for example changing the color of some text, you will see the changes inject into the page using livereload. Any file that belongs to the `src/Stylesheets.elm` import tree will trigger css injections on change.

If you edit `src/Main.elm`, you will see the page do a hard reload and

## Build your application

```sh
$ elm-factory build --public-path /build
```

If you then navigate to `http://localhost:8000/build` you will see the generated html file with your built and cache busted assets displaying!

# Have fun!

### Please post any issues/bugs or questions on the [github repository](https://github.com/farism/elm-factory/issues), or in the #elm slack channel.
