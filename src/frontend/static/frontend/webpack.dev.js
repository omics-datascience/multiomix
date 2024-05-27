const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

module.exports = merge(common, {
    mode: 'development',
    // Enable sourcemaps for debugging Webpack output.
    // devtool: 'eval',
    devtool: false,
    watchOptions: {
        ignored: /node_modules/
    },
    optimization: {
        minimizer: [
            new CssMinimizerPlugin()
        ]
    },
    module: {
        rules: [
            // Adds support for ts(x) files with ts-loader which can show Typescript error on transpilation
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader'
                    }
                ]
            }
        ]
    }
})
