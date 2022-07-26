const path = require('node:path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  target: 'web',
  mode: (
    process && process.env && process.env.NODE_ENV && process.env.NODE_ENV === 'development'
    ? 'development'
    : 'production'
  ),
  entry: './src/index.js',
  output: {
    path: path.resolve(process.cwd(), 'output'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      { test: /\.s?(a|c)ss$/, use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'] },
      { 
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/, 
        type: 'asset/resource',
      },
      {
        test: /\.(png|jpg)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: '[name].[fullhash].css' }),
    new HtmlWebpackPlugin({ 
      title: 'Tales of probability and sampling', 
      template: './src/index.html',
    })
  ],
  resolve: {
    extensions: ['.js'],
  },
};
