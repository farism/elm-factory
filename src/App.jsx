import React, { PureComponent } from 'react';
import { Router, Route, browserHistory } from 'react-router';

import HomePage from './components/HomePage';
import NotFoundPage from './components/NotFoundPage';
import PageWrapper from './components/PageWrapper';
import CLIWrapper from './components/CLIWrapper';
import ConfigWrapper from './components/ConfigWrapper';

export default class App extends PureComponent {
  render() {
    return (
      <Router history={browserHistory}>
        <Route component={PageWrapper}>
          <Route path="/" component={HomePage} />
          <Route path="/cli(/:command)" component={CLIWrapper} />
          <Route path="/config(/:property)(/:extra)" component={ConfigWrapper} />
          <Route path="*" component={NotFoundPage} />
        </Route>
      </Router>
    );
  }
}
