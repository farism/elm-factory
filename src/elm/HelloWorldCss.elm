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
            [ backgroundColor (hex "FF0000")
            , color (hex "FFFFFF")
            ]
        , class Container
            [ margin zero
            , padding zero
            ]
        ]
