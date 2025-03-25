const common = require('./rspack.config.js');

module.exports = {
    ...common,
    mode: 'development',
    devtool: 'source-map',
    watchOptions: {
        ignored: /node_modules/
    }
};
