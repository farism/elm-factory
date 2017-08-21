module Assets exposing (..)


type Asset
    = AssetUrl String


url : Asset -> String
url asset =
    case asset of
        AssetUrl url ->
            url



-- assetFunction =
-- AssetUrl "/src/assets/elm.png"
