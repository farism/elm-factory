module HelloWorldCss exposing (..)

import Css exposing (..)
import Css.Namespace exposing (namespace)


type CssClasses
    = Container


type CssIds
    = Page


css =
    (stylesheet << namespace "helloworld")
        [ id Page
            [ backgroundColor (hex "000000")
            , color (hex "FF0000")
            , fontSize (px 50)
            ]
        , class Container
            [ margin zero
            , padding zero
            ]
        ]
