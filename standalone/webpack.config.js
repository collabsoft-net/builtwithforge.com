/* eslint-disable */
'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

const path = require('path');
const crypto = require('crypto');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

// ------------------------------------------------------------------------------------------ Module Exports

const getBaseConfig = (type) => ({
  entry: {
    app: `./src/${type}/index.ts`
  },

  output: {
    filename: '[name].[fullhash].js',
    path: path.resolve(__dirname, `./public/${type}`)
  },

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    modules: [
      'node_modules',
      path.join(__dirname, '../frontend', 'node_modules'),
      path.join(__dirname, '../api', 'node_modules'),
    ],
    alias: {
      'API': path.resolve(__dirname, '../api/src'),
      'UI': path.resolve(__dirname, '../frontend/src')
    },
    fallback: {
      url: require.resolve('url'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      fs: false,
      dgram: false,
      net: false,
      tls: false,
      child_process: false,
      vm: false
    }
  },

  externals: {
    AP: 'AP'
  },

  node: {
    // prevent webpack from injecting eval / new Function through global polyfill
    global: false
  },

  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        loader: 'ts-loader',
        exclude: [
          /\/node_modules\//
        ]
      },
      {
        test: /\.(jpe?g|gif|png|svg)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 100000
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' }
        ]
      }
    ],
  },

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            // get the name. E.g. node_modules/packageName/not/this/part.js
            // or node_modules/packageName
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            const name = `npm.${packageName.replace('@', '')}`;

            // npm package names are URL-safe, but some servers don't like @ symbols
            if (process.env.NODE_ENV !== 'production') {
              return name;
            } else {
              const hash = crypto.createHash('sha256');
              return hash.update(name).digest('hex').substr(0,6);
            }
          },
        },
      },
    },
  },

  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new webpack.DefinePlugin({
      'gobal': 'window',
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV !== 'production' ? 'development' : 'production'),
      'process.env.LICENSING_ENABLED': JSON.stringify(process.env.LICENSING_ENABLED),
      'process.env.AC_BASEURL': JSON.stringify(process.env.AC_BASEURL)
    }),
    new CopyPlugin({
      patterns: [
        {
          from: '../frontend/src/assets',
          to: `../assets/[name][ext]`
        }
      ],
    })
  ]
});

const getConfig = (type) => {
  const config = getBaseConfig(type);

  const htmlWebpackPluginConfig = {
    inject: 'body',
    template: path.resolve(__dirname, `./src/${type}/index.html`),
    chunksSortMode: 'none'
  };

  if (process.env.NODE_ENV === 'production') {
    config.mode = 'production';
    config.devtool = false;
    htmlWebpackPluginConfig.minify = {
      caseSensitive: true,
      collapseWhitespace: true
    };
  } else {
    config.mode = 'development';
    config.devtool = 'cheap-source-map';
    config.plugins.push(new webpack.NoEmitOnErrorsPlugin());
  }

  config.plugins.push(new HtmlWebpackPlugin(htmlWebpackPluginConfig));
  return config;
};

module.exports = [ getConfig('pages'), getConfig('macro') ];