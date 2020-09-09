
const path = require('path');
const MediaQueryPlugin = require('../../../src');
const { merge } = require('webpack-merge');
const baseConfig = require('./base');

module.exports = merge(baseConfig, {
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, `../../output/only-javascript-output`)
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    'css-loader',
                    MediaQueryPlugin.loader,
                    'sass-loader'
                ]
            }
        ]
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
    ]
});