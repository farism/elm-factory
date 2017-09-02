import { expect } from 'chai'

import { build, dev, init } from '../src/defaults'

describe('defaults', () => {
  it('should have the correct build defaults', () => {
    expect(build).to.eql({
      main: './src/Main.elm',
      stylesheets: './src/Stylesheets.elm',
      html: undefined,
      outputPath: 'build',
      publicPath: '/public/',
    })
  })

  it('should have the correct dev defaults', () => {
    expect(dev).to.eql({
      main: './src/Main.elm',
      stylesheets: './src/Stylesheets.elm',
      html: './index.ejs',
      host: '127.0.0.1',
      port: 8000,
      reactorHost: '127.0.0.1',
      reactorPort: 8001,
      proxy: [],
      proxyRewrite: true,
    })
  })

  it('should have the correct init defaults', () => {
    expect(init).to.eql({
      force: false
    })
  })
})
