module Main exposing (..)

import Html exposing (Html, div)
import Html.CssHelpers exposing (withNamespace)
import Html.Attributes exposing (id, src)


-- import Css exposing (..)

import MainCss
import Asset exposing (url)
import Assets exposing (hero)


{ id, class, classList } =
    withNamespace "helloworld"


main : Html a
main =
    div [ id MainCss.Page ]
        [ Html.text "Hello, World!!"
        , Html.img [ src (url hero) ] []
        , div [ id MainCss.Page2 ] []
        ]
