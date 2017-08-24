const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const rules = require('./webpack.rules')

const HOST = process.env.HOST || '127.0.0.1'
const PORT = process.env.PORT || '8888'
const WEBPACK_DEVTOOL = process.env.WEBPACK_DEVTOOL || 'eval-source-map'

rules.push({
  test: /\.scss$/,
  exclude: /(node_modules)/,
  loaders: [
    'style-loader?sourceMap',
    'css-loader?modules&importLoaders=1&localIdentName=[path]___[name]__[local]___[hash:base64:5]&sourceMap',
    'postcss-loader',
    'sass-loader',
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
  externals: {
    fs: 'fs',
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  module: {
    rules,
  },
  devServer: {
    contentBase: './',
    noInfo: true,
    hot: true,
    inline: true,
    historyApiFallback: true,
    port: PORT,
    host: HOST,
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"development"',
      },
    }),
    new HtmlWebpackPlugin({
      template: './src/template.ejs',
      environment: 'development',
    }),
  ],
}
