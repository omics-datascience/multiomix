const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const LightningCSS = require('lightningcss');
const browsersList = require('browserslist');
const common = require('./rspack.config.js');

module.exports = {
    ...common, // Combinar manualmente con el archivo base
    mode: 'production',
    devtool: false,
    module: {
        rules: [
            ...common.module.rules, // Mantiene reglas de `rspack.config.js`
            {
                test: /\.tsx?$/,
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
                minify: TerserPlugin.swcMinify,
            }),
            new CssMinimizerPlugin({
                minify: CssMinimizerPlugin.lightningCssMinify,
                minimizerOptions: {
                    safe: true,
                    targets: LightningCSS.browserslistToTargets(browsersList('>= 0.25%'))
                }
            })
        ]
    }
};
