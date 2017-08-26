module MainCss exposing (..)

import Css exposing (..)
import Css.Namespace exposing (namespace)
import Assets exposing (hero)


type CssIds
    = Page


type CssClasses
    = Hero


css =
    (stylesheet << namespace "main")
        [ id Page
            [ backgroundColor (hex "FFFFFF")
            , color (hex "000000")
            , fontSize (px 50)
            ]
        , class Hero
            [ backgroundImage (url (Assets.url hero)) ]
        ]
