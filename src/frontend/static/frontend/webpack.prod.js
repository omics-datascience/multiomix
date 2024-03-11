const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')

// Plugins
const TerserPlugin = require('terser-webpack-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

module.exports = merge(common, {
    mode: 'production',
    devtool: 'false',
    // TODO: Webpack 5 will have TerserPlugin installed by default
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({}),
            new CssMinimizerPlugin({
                // Safe: true prevents problems with z-index
                cssProcessorOptions: {
                    safe: true
                }
            })
        ]
    }
})
