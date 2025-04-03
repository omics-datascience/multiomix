const common = require('./common.config.js')

module.exports = {
    ...common,
    mode: 'production',
    devtool: false,
    module: {
        rules: [
            ...common.module.rules,
            {
                test: /\.ts(x)?$/,
                exclude: /node_modules/,
                loader: 'builtin:swc-loader',
                options: {
                    jsc: {
                        parser: {
                            syntax: 'typescript'
                        }
                    }
                },
                type: 'javascript/auto'
            }
        ]
    }
}
