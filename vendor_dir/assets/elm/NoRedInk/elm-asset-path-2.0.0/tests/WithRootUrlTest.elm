module WithRootUrlTest exposing (..)

import Test exposing (..)
import Test.Runner.Node exposing (run, TestProgram)
import Json.Encode exposing (Value)
import Expect
import Ports exposing (emit)
import AssetPath exposing (Asset(..))


main : TestProgram
main =
    run emit all


all : Test
all =
    describe "url"
        [ test "absolute path" <|
            \() ->
                Expect.equal (AssetPath.url <| AssetPath "/star.png") "https://cdn.elm-lang.org/star.png"
        , test "relative path" <|
            \() ->
                Expect.equal (AssetPath.url <| AssetPath "star.png") "https://cdn.elm-lang.org/star.png"
        , test "url" <|
            \() ->
                Expect.equal (AssetPath.url <| AssetUrl "star.png") "star.png"
        ]
