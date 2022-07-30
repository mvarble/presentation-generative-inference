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
    filename: 'bundle.[fullhash].js',
  },
  module: {
    rules: [
      { 
        test: /\.(j|t)s$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: { presets: ['@babel/preset-env', '@babel/preset-typescript'] },
        },
      },
      { 
        test: /\.s?(a|c)ss$/, 
        use: [
          MiniCssExtractPlugin.loader, 
          {
            loader: 'css-loader', 
            options: {
              esModule: true,
              modules: {
                auto: true,
                namedExport: true,
              },
            },
          },
          'sass-loader'
        ] 
      },
      { 
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/, 
        type: 'asset/resource',
        generator: {
          filename: path.join('fonts', '[name]'),
        },
      },
      { 
        test: /\.(png|jpg)$/, 
        type: 'asset/resource',
        generator: {
          filename: path.join('images', '[name]'),
        },
      },
      { test: /\.(jl|txt)$/, type: 'asset/source' },
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
    extensions: ['.js', '.ts'],
  },
};
