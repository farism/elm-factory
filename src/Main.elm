module Main exposing (..)

import Html exposing (..)
import Html.CssHelpers exposing (..)
import Html.Attributes exposing (..)
import Css exposing (..)
import HelloWorldCss


{ id, class, classList } =
    withNamespace "helloworld"


main : Html a
main =
    div [ id HelloWorldCss.Page ]
        [ Html.text "Hello, World!!" ]
