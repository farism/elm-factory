module Main exposing (..)

import Html exposing (Html, div, p)
import Html.CssHelpers exposing (withNamespace)
import Html.Attributes exposing (id, src)
import MainCss
import Assets exposing (url, hero)


{ id, class, classList } =
    withNamespace "main"


main : Html a
main =
    div [ id MainCss.Page ]
        [ div [] [ Html.text "Hello, World!!" ]
        , div [] [ Html.img [ src (url hero) ] [] ]
        , div [ id MainCss.Page ]
            [ p [] [ Html.text "This is a paragraph" ]
            ]
        ]
