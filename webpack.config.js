const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const loaders = require('./webpack.loaders')

const HOST = process.env.HOST || '127.0.0.1'
const PORT = process.env.PORT || '8888'
const WEBPACK_DEVTOOL = process.env.WEBPACK_DEVTOOL || 'eval-source-map'

// global css
loaders.push({
  test: /\.css$/,
  exclude: /[/\\]src[/\\]/,
  loaders: ['style?sourceMap', 'css'],
})
// local scss modules
loaders.push({
  test: /\.scss$/,
  exclude: /[/\\](node_modules|build\/)[/\\]/,
  loaders: [
    'style?sourceMap',
    'css?modules&importLoaders=1&localIdentName=[path]___[name]__[local]___[hash:base64:5]&sourceMap',
    'postcss',
    'sass',
  ],
})

// local css modules
loaders.push({
  test: /\.css$/,
  exclude: /[/\\](node_modules|build\/)[/\\]/,
  loaders: [
    'style?sourceMap',
    'css?modules&importLoaders=1&localIdentName=[path]___[name]__[local]___[hash:base64:5]&sourceMap',
  ],
})

module.exports = {
  entry: ['react-hot-loader/patch', './src/index.jsx'],
  devtool: WEBPACK_DEVTOOL,
  output: {
    publicPath: '/',
    path: path.join(__dirname, 'build'),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
  },
  module: {
    loaders,
  },
  devServer: {
    contentBase: './build',
    // do not print bundle build stats
    noInfo: true,
    // enable HMR
    hot: true,
    // embed the webpack-dev-server runtime into the bundle
    inline: true,
    // serve index.html in place of 404 responses to allow HTML5 history
    historyApiFallback: true,
    port: PORT,
    host: HOST,
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      template: './src/template.html',
    }),
  ],
}
