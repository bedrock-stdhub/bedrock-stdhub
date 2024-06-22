const path = require('path');

module.exports = {
  target: 'node',
  mode: 'production',
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [ '.ts', '.js' ],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },
  output: {
    filename: 'mc-bedrock-stdhub.js',
    path: path.resolve(__dirname, 'dist'),
  },
};