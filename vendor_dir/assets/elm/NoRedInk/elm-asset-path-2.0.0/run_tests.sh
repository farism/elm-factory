#!/bin/bash -e

cd tests
./build.sh --yes

echo
echo "-- Testing with ava x jsdom -----------------------------"
echo
../node_modules/.bin/ava test.js

echo
echo "-- Testing with elm-test --------------------------------"
echo
../node_modules/.bin/elm-test NoRootUrlTest.elm  --compiler ../node_modules/.bin/elm-make
