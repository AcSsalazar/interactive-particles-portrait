const path = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const __root = path.resolve(__dirname, '../');

module.exports = {
  entry: {
    index: ['core-js/stable', 'regenerator-runtime/runtime', './src/scripts/index.js'], // ✅ Corregido (sin barra inicial)
  },
  output: {
    path: path.resolve(__root, 'dist'),
    filename: 'scripts/[name].[contenthash].js',
    chunkFilename: 'scripts/[name].[contenthash].js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-syntax-dynamic-import']
          }
        },
        exclude: /node_modules/
      },
      {
        test: /\.(glsl|frag|vert)$/,
        use: [
          'raw-loader',
          'glslify-loader'  // ✅ Asegura que Webpack procese shaders GLSL correctamente
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
      },
      {
        test: /\.(jpe?g|png|gif)$/i,
        type: 'asset/resource',
      }
    ]
  },
  resolve: {
    alias: {
      'three-examples': path.join(__root, './node_modules/three/examples/jsm'), // ✅ Cambia a la versión moderna de Three.js
    }
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__root, 'static'),
          to: path.resolve(__root, 'dist/static')
        }
      ]
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
    new webpack.ProvidePlugin({
      'THREE': 'three'
    })
  ]
};
