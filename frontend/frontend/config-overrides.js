const webpack = require('webpack');

module.exports = function override(config) {
  // Add fallbacks for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    buffer: require.resolve('buffer/'),
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    fs: false,
    path: false,
    os: false,
    process: require.resolve('process/browser'), // <-- Add process fallback
  };

  // Explicit alias for process/browser (some modules import it directly)
  config.resolve.alias = {
    ...config.resolve.alias,
    'process/browser': require.resolve('process/browser'),
  };

  // Provide Buffer and process globally
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser', // <-- Use the correct path
    }),
  ]);

  return config;
};


//npm install buffer crypto-browserify stream-browserify process