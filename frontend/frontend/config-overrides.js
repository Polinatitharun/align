const webpack = require('webpack');

module.exports = {
  webpack: function override(config) {
    // Add fallbacks for Node.js core modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve('buffer/'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      fs: false,
      path: false,
      os: false,
      process: require.resolve('process/browser'),
    };

    // Explicit alias for process/browser
    config.resolve.alias = {
      ...config.resolve.alias,
      'process/browser': require.resolve('process/browser'),
    };

    // Provide Buffer and process globally
    config.plugins = (config.plugins || []).concat([
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      }),
    ]);

    return config;
  },
  jest: function (config) {
    config.moduleNameMapper = {
      ...config.moduleNameMapper,
      '^axios$': require.resolve('axios/dist/node/axios.cjs'),
    };
    return config;
  },
};