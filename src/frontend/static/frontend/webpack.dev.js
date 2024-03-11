const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')

module.exports = merge(common, {
    mode: 'development',
    // Enable sourcemaps for debugging Webpack output.
    // devtool: 'source-map',cheap-module-source-map,
    devtool: 'source-map',
    watchOptions: {
        ignored: /node_modules/
    }
})
