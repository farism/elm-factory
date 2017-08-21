import React from 'react'
import Interactive from 'react-interactive'
import { Switch, Route } from 'react-router-dom'
import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import TopNav from './TopNav'
import Home from './Home'
import ExampleComponent from './ExampleComponent'
import PageNotFound from './PageNotFound'

export default function App() {
  return (
    <MuiThemeProvider muiTheme={getMuiTheme(lightBaseTheme)}>
      <div>
        <TopNav />
        <Switch>
          <Route exact path="/" component={Home} />
          <Route component={PageNotFound} />
        </Switch>
      </div>
    </MuiThemeProvider>
  )
}
