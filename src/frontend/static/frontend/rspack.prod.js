import { common } from './'

export default {
    ...common,
    mode: 'production',
    devtool: false
    // NOTE: no need to set minimizer here, as it's already set by RSPack (read more at https://rspack.dev/config/optimization#optimizationminimizer)
}
