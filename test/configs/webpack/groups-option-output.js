
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const MediaQueryPlugin = require('../../../src');

module.exports = {
    mode: 'development',
    devtool: 'none',
    entry: {
        app: './test/data/app.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, `../../output/groups-option-output`)
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
            include: true,
            queries: {
                'print, screen and (max-width: 60em)': 'desktop'
            },
            groups: {
                app: /^example/
            }
        })
    ],
    stats: {
        children: false
    }
};