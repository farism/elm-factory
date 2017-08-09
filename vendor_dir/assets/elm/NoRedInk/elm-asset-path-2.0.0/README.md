# AssetPath [![Build Status](https://travis-ci.org/NoRedInk/elm-asset-path.svg?branch=master)](https://travis-ci.org/NoRedInk/elm-asset-path)

Elm package for defining a typed asset path and obtaining its URL.

## Installation

This package is currently not on http://package.elm-lang.org/.

Install with [native_package_install.py][native_package_install] by adding
`elm-native-package.json` to your project:

```json
{
  "NoRedInk/elm-asset-path": "2.0.0"
}
```

and running:

```sh
$ native_package_install.py elm-native-package.json \
  --elm-config elm-package.json \
  --vendor vendor_dir/assets/elm
```

  [native_package_install]: https://github.com/NoRedInk/elm-ops-tooling/blob/master/native_package_install.py


## Usage

```elm
import Html exposing (..)
import Html.Attributes exposing (..)
import AssetPath exposing(Asset(..))


viewStar : Html msg
viewStar =
    img [ src <| AssetPath.url <| AssetPath "/assets/star.png" ]
        []
```

Without further configuration, the generated image element will be:

```html
<img src="/assets/star.png"/>
```

Not very useful, huh?

By including a meta tag with the name `assets-root-url` in your HTML's `<head>`
tag, you can control which host to direct requests for static assets:

```html
<meta name="assets-root-url" content="https://cdn.example.com/">

...

<img src="https://cdn.example.com/assets/star.png"/>
```

Furthermore, when used in conjunction with [elm-assets-loader][elm-assets-loader], a loader
for [webpack][webpack], you can make it so that the filename is tagged with the
hash of its image content, so that it's easier to cache and invalidate:


```html
<img src="https://cdn.example.com/assets/star-038a1253d7a9e4682deb72cd68c3a328.png"/>
```

Refer to [elm-assets-loader][elm-assets-loader]'s documentation for further
configuration options.

  [elm-assets-loader]: https://github.com/NoRedInk/elm-assets-loader
  [webpack]: https://webpack.github.io/
