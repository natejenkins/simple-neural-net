const webpack = require('webpack')
const {resolve} = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: {
    index: resolve(__dirname, './src/index.js'),
    vendor: ['react', 'react-dom'],
  },

  output: {
    filename: '[name].[hash].js',
    path: resolve(__dirname, './dist'),
    publicPath: '',
  },

  node: {
    fs: 'empty',
  },

  devServer: {
    contentBase: './dist',
  },

  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          cacheDirectory: true,
        },
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: resolve(__dirname, './src/index.html'),
      filename: 'index.html',
      inject: 'body',
    }),
  ],
}
