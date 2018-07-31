const Encore = require('@symfony/webpack-encore');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const MediaQueryPlugin = require('../src/');
// const MediaQueryPlugin = require('media-query-plugin');

Encore
    .cleanupOutputBeforeBuild()
    .enableBuildNotifications()
    .enableSingleRuntimeChunk()
    .setOutputPath('dist/')
    .setPublicPath('/dist')
    .addEntry('app', './src/app.js')
    .enableSourceMaps()
    .addLoader({ 
        test: /\.scss$/, 
        use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            MediaQueryPlugin.loader,
            'postcss-loader',
            'sass-loader'
        ]
    })
    .addPlugin(
        new MiniCssExtractPlugin()
    )
    .addPlugin(
        new MediaQueryPlugin({
            include: true,
            queries: {
                'screen and (min-width: 60em)': 'desktop'
            }
        })
    )
;

module.exports = Encore.getWebpackConfig();