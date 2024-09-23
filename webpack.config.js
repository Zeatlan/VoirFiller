const path = require('path');

module.exports = {
    entry: {
      'service-worker': './src/service-worker.ts',
      'content': './src/content.ts'
    },
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
      extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist'),
    },
    devtool: false,
    devServer: {
      
      proxy: {
        '/api': {
          target: 'https://www.animefillerlist.com',
          changeOrigin: true,
          pathRewrite: { '^/api': '/shows' },
        },
      },
    }
};