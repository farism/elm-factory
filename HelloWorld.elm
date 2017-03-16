module Main exposing (..)

import Html exposing (..)
import Html.Attributes
import Css


styles =
    Css.asPairs >> Html.Attributes.style


main =
    div [ styles [ Css.color (Css.hex "#ff0000") ] ] [ Html.text "Hello, World!" ]
