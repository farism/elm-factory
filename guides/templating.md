# Templating

## Using templates

When using `elm-factory init` a file named `./index.ejs` will scaffolded. This file is the default used for the `--html` flag for the `dev` and `build` commands.

When navigating to an `*.elm` file, this html template will be used rather than the default `elm-reactor` page you would see. This allows you to render the html with additional elements like `<link>` or `<script>` tags.

## Dev server templates

There are a few values provided to the template context, namely the `environment` and `request` values. The environment will be `development` when using the dev server and `production` when building. The request will be whatever the current server request object is.

## Build production templates

There are a few values provided to the template context, namely the `environment`, `jsManifest`, and `cssManifest` values. The environment will be `production` when building.

The manifest objects will have a mapping of `originalName : cachedName` entries. These `manifest.json` files can also be put onto a CDN somewhere and any backend server can fetch them and use them to dynamically serve up the correct cache busted files.

## Supported templates

The default `index.ejs` file is using the EJS templating engine, but it's not the only supported engine. [`any-template`](https://github.com/farism/gulp-any-template) supports the additional following templating engines:

- Dustjs-linkedin
- EJS
- Handlebars
- Hogan
- lodash.template
- Mustache
- Pug (Jade)
- Swig
- underscore.template
