
const MediaQueryPlugin = require('../../../src');

module.exports = {
    mode: 'development',
    devtool: 'none',
    entry: {
        example: './test/data/example.js'
    },
    plugins: [
        new MediaQueryPlugin({
            include: [
                'example'
            ],
            queries: {
                'print, screen and (max-width: 60em)': 'desktop'
            }
        })
    ],
    stats: {
        children: false
    }
};