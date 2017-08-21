import React from 'react'
import ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'

import './index.scss'
import App from './App'

function render(Component) {
  ReactDOM.render(
    <AppContainer>
      <Component />
    </AppContainer>,
    document.querySelector('#app')
  )
}

if (module && module.hot) {
  module.hot.accept('./App.jsx', () => {
    render(require('./App').default)
  })
}

render(App)
