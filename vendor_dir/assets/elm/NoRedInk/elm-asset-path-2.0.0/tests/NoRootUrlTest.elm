module NoRootUrlTest exposing (..)

import Test exposing (..)
import Test.Runner.Node exposing (run, TestProgram)
import Json.Encode exposing (Value)
import Expect
import Ports exposing (emit)
import AssetPath exposing (Asset(..))
import AssetPath.Css


main : TestProgram
main =
    run emit all


all : Test
all =
    describe "without assets-root-url"
        [ describe "url"
            [ test "absolute path" <|
                \() ->
                    Expect.equal (AssetPath.url <| AssetPath "/star.png") "/star.png"
            , test "relative path" <|
                \() ->
                    Expect.equal (AssetPath.url <| AssetPath "star.png") "star.png"
            ]
        , describe "Css.url"
            [ test "absolute path" <|
                \() ->
                    Expect.equal (AssetPath.Css.url <| AssetPath "/star.png") "url(/star.png)"
            , test "relative path" <|
                \() ->
                    Expect.equal (AssetPath.Css.url <| AssetPath "star.png") "url(star.png)"
            ]
        ]
