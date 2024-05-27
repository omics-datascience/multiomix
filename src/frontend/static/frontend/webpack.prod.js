const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')

// Plugins
const TerserPlugin = require('terser-webpack-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const LightningCSS = require('lightningcss')
const browsersList = require('browserslist')

module.exports = merge(common, {
    mode: 'production',
    devtool: false,
    module: {
        rules: [
            // Adds support for ts(x) files with swc-loader which transpiles fast but can NOT show Typescript error during the process
            // more info at: https://github.com/swc-project/pkgs/issues/21
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'swc-loader',
                    options: {
                        module: {
                            type: 'es6',
                            strict: false
                        },
                        minify: true,
                        isModule: true,
                        jsc: {
                            minify: {
                                compress: true,
                                mangle: true,
                                format: {
                                    asciiOnly: true,
                                    comments: /^ webpack/
                                }
                            },
                            target: 'es2016',
                            parser: {
                                syntax: 'typescript',
                                tsx: true,
                                decorators: true
                            },
                            transform: {
                                react: {
                                    runtime: 'automatic'
                                }
                            }
                        }
                    }
                }
            }
        ]
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                minify: TerserPlugin.swcMinify
            }),
            new CssMinimizerPlugin({
                minimizerOptions: {
                    preset: [
                        'default',
                        {
                            discardComments: { removeAll: true }
                        }
                    ],
                    safe: true,
                    targets: LightningCSS.browserslistToTargets(browsersList('>= 0.25%'))
                }
            })
        ]
    }
})
