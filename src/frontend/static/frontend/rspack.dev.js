const common = require('./rspack.config.js')

module.exports = {
    ...common,
    mode: 'development',
    // Enable sourcemaps for debugging Webpack output.
    // devtool: 'source-map',
    devtool: false,
    watchOptions: {
        ignored: /node_modules/
    },
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
