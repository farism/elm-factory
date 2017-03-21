port module Stylesheets exposing (..)

import Css.File exposing (CssFileStructure, CssCompilerProgram)
import HelloWorldCss


port files : CssFileStructure -> Cmd msg


fileStructure : CssFileStructure
fileStructure =
    Css.File.toFileStructure
        [ ( "index.css", Css.File.compile [ HelloWorldCss.css ] ) ]


main : CssCompilerProgram
main =
    Css.File.compiler files fileStructure
