const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// Generate a unique cache-busting version stamp for favicons
// Uses build timestamp to ensure browsers fetch fresh assets after each deploy
const FAVICON_VERSION = Date.now().toString();

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      // Inject favicon version for cache-busting
      templateParameters: {
        FAVICON_VERSION: FAVICON_VERSION,
      },
    }),
    new webpack.DefinePlugin({
      'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL),
      'process.env.FAVICON_VERSION': JSON.stringify(FAVICON_VERSION),
    }),
    // Replace favicon version placeholder in the generated HTML
    {
      apply: (compiler) => {
        compiler.hooks.compilation.tap('FaviconVersionPlugin', (compilation) => {
          HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
            'FaviconVersionPlugin',
            (data, cb) => {
              data.html = data.html.replace(/__FAVICON_VERSION__/g, FAVICON_VERSION);
              cb(null, data);
            }
          );
        });
      },
    },
    // 🛑 NEW: Copy the public/assets directory to the root of the dist folder
    new CopyWebpackPlugin({
        patterns: [
            { 
                from: 'public/assets', 
                to: 'assets', // Destination is dist/assets
                noErrorOnMissing: true // Allows deployment even if folder is temporarily empty
            }
        ]
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true,
  },
};