const path = require('path')
const BundleTracker = require('webpack-bundle-tracker')

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
        filename: '[name]-[contenthash].js',
        clean: true
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.css']
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(png|jpg|woff|woff2|eot|ttf|svg)$/,
                type: 'asset/resource'
            }
        ]
    },
    plugins: [
        new BundleTracker({ filename: 'webpack-stats.json' })
    ]
}
