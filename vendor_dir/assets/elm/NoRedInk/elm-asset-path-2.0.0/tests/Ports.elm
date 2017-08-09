port module Ports exposing (emit)

import Json.Encode exposing (Value)


port emit : ( String, Value ) -> Cmd msg
