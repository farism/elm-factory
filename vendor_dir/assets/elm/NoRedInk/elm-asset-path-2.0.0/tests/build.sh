#!/bin/bash -ex

mkdir -p build
../node_modules/.bin/elm-make WithRootUrlTest.elm --output build/with_root_url_test.js $@
../node_modules/.bin/elm-make NoRootUrlTest.elm --output build/no_root_url_test.js $@
