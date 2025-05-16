import { common } from './rspack.common.js'
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
        ...common.plugins, // Keeps plugins from `rspack.common.js`
        // Enables TypeScript type checking
        new TsCheckerRspackPlugin({
            async: false, // This prevents the page to load correctly if there are type errors
        })
    ]
}
