import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import BundleTracker from 'webpack-bundle-tracker'
import { rspack } from '@rspack/core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PATHS = {
    src: path.join(__dirname, 'src'),
    output: path.join(__dirname, 'dist')
}

export const common = {
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
        openSource: `${PATHS.src}/open-source.tsx`,
        sitePolicy: `${PATHS.src}/site-policy.tsx`
    },
    output: {
        path: PATHS.output,
        filename: '[name]-[contenthash].js',
        clean: true
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.css']
    },
    module: {
        rules: [
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
            },
            {
                test: /\.css$/,
                use: [rspack.CssExtractRspackPlugin.loader, 'css-loader'],
                type: 'javascript/auto',
            },
            {
                test: /\.(png|jpg|woff|woff2|eot|ttf|svg)$/,
                type: 'asset/resource'
            }
        ]
    },
    plugins: [
        new rspack.CssExtractRspackPlugin({
            filename: '[name]-[contenthash].css'
        }),
        new BundleTracker({
            path: PATHS.output,
            filename: 'webpack-stats.json'
        })
    ]
}
