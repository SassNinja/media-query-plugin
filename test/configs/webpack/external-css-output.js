
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const MediaQueryPlugin = require('../../../src');
const merge = require('webpack-merge');
const baseConfig = require('./base');

module.exports = merge(baseConfig, {
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, `../../output/external-css-output`)
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    MediaQueryPlugin.loader,
                    'sass-loader'
                ]
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].css'
        }),
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