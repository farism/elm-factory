import React from 'react'
import { render } from 'react-dom'
import { AppContainer } from 'react-hot-loader'

import './index.scss'
import App from './App'

render(
  <AppContainer>
    <App />
  </AppContainer>,
  document.querySelector('#app')
)

if (module && module.hot) {
  module.hot.accept('./App.jsx', () => {
    const NewApp = require('./App').default // eslint-disable-line
    render(
      <AppContainer>
        <NewApp />
      </AppContainer>,
      document.querySelector('#app')
    )
  })
}
