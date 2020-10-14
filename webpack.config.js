const path = require('path');

module.exports = {
  entry: './src/CTATChart.js',
  target: ["web", "es5"],
  output: {
    filename: 'CTATChart.js',
    path: path.resolve(__dirname, 'lib'),
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      }
    ],
  }
};
