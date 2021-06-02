const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')

module.exports = merge(common, {
    mode: 'development',
    // Enable sourcemaps for debugging Webpack output.
    // devtool: 'source-map',
    devtool: 'false',
    watchOptions: {
        ignored: /node_modules/
    }
})
