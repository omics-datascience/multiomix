const common = require('./common.config.js')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
    ...common,
    mode: 'development',
    // Enable sourcemaps for debugging Webpack output.
    // devtool: 'source-map',
    devtool: false,
    watchOptions: {
        ignored: /node_modules/
    },
    plugins: [
        ...common.plugins,
        new ForkTsCheckerWebpackPlugin()
    ],
    module: {
        rules: [
            ...common.module.rules, // Keeps rules from `rspack.config.js`
            // Adds support for ts(x) files with ts-loader which can show Typescript error on transpilation
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: 'ts-loader'
            }
        ]
    }
}