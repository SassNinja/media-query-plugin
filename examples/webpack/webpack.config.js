
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const MediaQueryPlugin = require('../../src/');
// const MediaQueryPlugin = require('media-query-plugin');

module.exports = {
    mode: 'development',
    devtool: 'inline-source-map',
    entry: {
        example: './src/example.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    MediaQueryPlugin.loader,
                    'postcss-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            implementation: require('sass')
                        }
                    }
                ]
            },
            {
                test: /\.hbs$/,
                use: [
                    {
                        loader: 'handlebars-loader',
                        options: {
                            helperDirs: [
                                path.resolve(__dirname, 'helpers')
                            ]
                        }
                    }
                ]
            }
        ]
    },
    optimization: {
        runtimeChunk: 'single'
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Media Query Example',
            template: './src/index.hbs',
            inject: false
        }),
        new MiniCssExtractPlugin({
            filename: '[name].css'
        }),
        new MediaQueryPlugin({
            include: [
                'example',
                'example2'
            ],
            queries: {
                'print, screen and (min-width: 60em)': 'desktop',
                'print, screen and (min-width: 60em) and (orientation: landscape)': 'desktop'
            }
        })
    ],
    stats: {
        children: false
    }
};