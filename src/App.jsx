import React from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'

import CLIWrapper from './components/CLIWrapper'
import ConfigWrapper from './components/ConfigWrapper'
import HomePage from './components/HomePage'
import NotFoundPage from './components/NotFoundPage'
import PageWrapper from './components/PageWrapper'
import ScrollToTop from './components/ScrollToTop'

export default class App extends React.Component {
  render() {
    return (
      <Router>
        <ScrollToTop>
          <PageWrapper>
            <Switch>
              <Route exact path="/" component={HomePage} />
              <Route path="/cli/:command?" component={CLIWrapper} />
              <Route path="/config/:type?" component={ConfigWrapper} />
              <Route path="*" component={NotFoundPage} />
            </Switch>
          </PageWrapper>
        </ScrollToTop>
      </Router>
    )
  }
}
