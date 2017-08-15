module Main exposing (..)

import Html exposing (Html, div)
import Html.CssHelpers exposing (withNamespace)
import Html.Attributes exposing (id, src)


-- import Css exposing (..)

import MainCss
import Assets exposing (url, hero)


{ id, class, classList } =
    withNamespace "helloworld"


main : Html a
main =
    div [ id MainCss.Page2 ]
        [ Html.text "Hello, World!!"
        , Html.img [ src (url hero) ] []
        , div [ id MainCss.Page2 ] []
        ]
