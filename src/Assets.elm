module Assets exposing (..)


type Asset
    = AssetUrl String


url : Asset -> String
url asset =
    case asset of
        AssetUrl url ->
            url


hero =
    AssetUrl "/src/assets/elm.png"


hero2 =
    AssetUrl "/src/assets/css3.png"
