const path = require('path')
const BundleTracker = require('webpack-bundle-tracker')

// Plugins
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

// General paths for reusability
const PATHS = {
    src: path.join(__dirname, 'src'),
    output: path.join(__dirname, 'dist')
}
module.exports = {
    entry: {
        base: `${PATHS.src}/base.tsx`,
        gem: `${PATHS.src}/gem.tsx`,
        main: `${PATHS.src}/index.tsx`,
        files: `${PATHS.src}/files.tsx`,
        institutions: `${PATHS.src}/institutions.tsx`,
        biomarkers: `${PATHS.src}/biomarkers.tsx`,
        login: `${PATHS.src}/login.tsx`,
        cgds: `${PATHS.src}/cgds.tsx`,
        survival: `${PATHS.src}/survival.tsx`,
        aboutUs: `${PATHS.src}/about-us.tsx`,
        sitePolicy: `${PATHS.src}/site-policy.tsx`
    },
    output: {
        path: PATHS.output,
        filename: '[name]-[hash].js'
    },
    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    module: {
        rules: [
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader'
                    }
                ]
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            // you can specify a publicPath here
                            // by default it uses publicPath in webpackOptions.output
                            publicPath: '../'
                        }
                    },
                    'css-loader'
                ]
            },
            {
                test: /\.(png|jpg|woff|woff2|eot|ttf|svg)$/,
                loader: 'url-loader'
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin({
            protectWebpackAssets: false
        }),
        new MiniCssExtractPlugin({
            filename: '[name]-[hash].css'
        }),
        new BundleTracker({ filename: 'webpack-stats.json' })
    ]
}
