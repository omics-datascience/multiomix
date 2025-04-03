import { common } from './common.config.js'
import { TsCheckerRspackPlugin } from 'ts-checker-rspack-plugin'

export default {
    ...common,
    mode: 'development',
    // Enable sourcemaps for debugging Webpack output.
    // devtool: 'source-map',
    devtool: false,
    watchOptions: {
        ignored: /node_modules/
    },
    plugins: [
        ...common.plugins, // Keeps plugins from `common.config.js`
        // Enables TypeScript type checking
        new TsCheckerRspackPlugin()
    ]
}
