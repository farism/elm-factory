module Main exposing (..)

import Html exposing (..)
import Html.CssHelpers exposing (..)
import Html.Attributes exposing (..)
import Css exposing (..)
import MyCss


{ id, class, classList } =
    withNamespace "helloworld"


main : Html a
main =
    div [ id MyCss.Page ] [ Html.text "Hello, World!" ]
