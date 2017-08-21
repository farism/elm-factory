import React from 'react'
import AppBar from 'material-ui/AppBar'
import FlatButton from 'material-ui/FlatButton'
import FontIcon from 'material-ui/FontIcon';

const TopNav = () =>
  <AppBar
    title={<span>elm-reactor</span>}
    iconElementRight={
      <FlatButton
        href="https://github.com/farism/elm-factory"
        target="_blank"
        secondary={true}
        icon={<FontIcon className="icon-github" />}
      />
    }
  />

export default TopNav
