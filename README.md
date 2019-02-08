# Media Query Plugin

[![Npm Version](https://badge.fury.io/js/media-query-plugin.svg)](https://www.npmjs.com/package/media-query-plugin) 
[![Build Status](https://travis-ci.com/SassNinja/media-query-plugin.svg?branch=master)](https://travis-ci.com/SassNinja/media-query-plugin) 
[![Month Downloads](https://img.shields.io/npm/dm/media-query-plugin.svg)](http://npm-stat.com/charts.html?package=media-query-plugin)

Have you ever thought about extracting your media queries from your CSS so a mobile user doesn't have to load desktop specific CSS?
If so this plugin is what you need!

When writing CSS with the help of a framework (such as [Bootstrap](https://getbootstrap.com/) or [Foundation](https://foundation.zurb.com/sites.html)) and with a modular design pattern you'll mostly end up with CSS that contains all media queries. Using this plugin lets you easily extract the media queries from your CSS and load it async.

So instead of forcing the user to load this

```css
.foo { color: red }
@media print, screen and (min-width: 75em) {
    .foo { color: blue }
}
.bar { font-size: 1rem }
```

he only has to load this always

```css
.foo { color: red }
.bar { font-size: 1rem }
```

and on desktop viewport size this in addition

```css
@media print, screen and (min-width: 75em) {
    .foo { color: blue }
}
```


## Prerequisites

You should already have a working webpack configuration before you try to use this plugin. If you haven't used webpack yet please go through the [webpack guide](https://webpack.js.org/guides/) first and start using this awesome tool for your assets mangement!

## Installation

Simply install the package with your prefered package manager.

- npm
```bash
npm install media-query-plugin --save-dev
```

- yarn
```bash
yarn add media-query-plugin --dev
```

## Let's get started

### 1. Loader

The plugin comes together with a loader which takes care of the CSS extraction from the source and provides it for the injection afterwards.

**Important:** make sure the loader receives plain CSS so place it between the css-loader and the sass-loader/less-loader.

```javascript
const MediaQueryPlugin = require('media-query-plugin');

module.exports = {
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    MediaQueryPlugin.loader,
                    'postcss-loader',
                    'sass-loader'
                ]
            }
        ]
    }
};
```

### 2. Plugin

Add the plugin to your webpack config. It will inject the extracted CSS of the loader after the compilation. To identify the target file for the injection it'll look for `[name]-[query]`. So if CSS with the query `desktop` is extracted from `example.scss`, it'll look for `example-desktop` to do the injection. In case there's no match the extracted CSS gets simply emited as CSS file (it doesn't disappear in nirvana :wink:).

```javascript
const MediaQueryPlugin = require('./plugins/media-query-plugin');

module.exports = {
    plugins: [
        new MediaQueryPlugin({
            include: [
                'example'
            ],
            queries: {
                'print, screen and (min-width: 75em)': 'desktop'
            }
        })
    ]
};
```

### 3. Use Extracted Files

If you import the extracted CSS (mostly as dynamic import with viewport condition), webpack will try to resolve that import and throw an error if the file does not exist. Thus you have to create those files manually before running webpack. Empty files as placeholder do the job (the get filled later by the plugin).

**Important:** as mentioned above the name of those files must follow the pattern `[name]-[query]` so an example file could be `example-desktop.scss`

```javascript
import './example.scss';

if (window.innerWidth >= 960) {
    import(/* webpackChunkName: 'example-desktop' */ './example-desktop.scss');
}
```

## Options

The following options are available.

| name        | mandatory |
| ----------- | --------- |
| include     | yes       |
| queries     | yes       |
| groups      | no        |

### include

Each chunk (which uses the loader) gets checked if its name matches this option. In case of a match each query specified in the `queries` options gets extracted from the chunk.

Possible types
- array (e.g. `['example']`)
- regex (e.g. `/example/`)
- boolean (e.g. `true`)

### queries

This option tells the plugin which media queries are supposed to get extracted. If a media query doesn't match it'll stay untouched. Otherwise it gets extracted and afterwards injected.

**Important:** make sure the queries match 100% the source CSS rule excl the `@media`.

**Tip:** you can use the same name for different media queries to concatenate them (e.g. desktop portrait and desktop landscape)

```javascript
queries: {
    'print, screen and (max-width: 60em) and (orientation: portrait)': 'desktop',
    'print, screen and (max-width: 60em) and (orientation: landscape)': 'desktop'
}
```

### groups

By default the name of the extracted CSS file(s) is `[chunk]-[query]`. This option lets you map chunk names to a specific group name what results in `[group]-[query]`.
So the following code would generate a `app-desktop.css` instead of `exampleA-desktop.css` and `exampleB-desktop.css`. This can be useful when working with [splitChunks](https://webpack.js.org/plugins/split-chunks-plugin/).

```javascript
groups: {
    app: ['exampleA', 'exampleB']
}
```

**Tip:** you can also use regex to target chunks
```javascript
groups: {
    app: /^example/
}
```

## Other Webpack Plugins

This plugin plays together well with the following other webpack plugins.

### mini-css-extract-plugin

If you don't want the CSS included in your JS but emit it as external files, you can use the [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin). The media query plugin automatically recognizes the additional CSS chunks and even takes over the plugins filename option!

### html-webpack-plugin

If you're using the hash feature of webpack (e.g. `[name].[hash].js`) you might also be using the [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin) to inject the hashed files into your templates. Good news – the media query plugin supports it! It hooks into the plugin and makes extracted files available in your HTML template via `htmlWebpackPlugin.files.extracted.js` or `htmlWebpackPlugin.files.extracted.css`.

This let you inject something as `<link rel="stylesheet" href="..." media="...">` so that the extracted files get downloaded but not applied if not necessary (reduces render blocking time). However most of the time it's better to use dynamic imports for the extracted CSS to achieve best performance.

Compared to the regular files (`htmlWebpackPlugin.files.js` or `htmlWebpackPlugin.files.css`) the extracted files object does not have the structure `[file, file]` but `[{file:file,query:query}, {file:file,query:query}]`. Keep this in mind when using it (or check out the example [template](examples/webpack/src/index.hbs)).

## Not using webpack?

This plugin is built for webpack only and can't be used with other module bundlers (such as [FuseBox](https://fuse-box.org/)) or task runners (such as [Gulp](https://gulpjs.com/)). However if you can't or don't want to use webpack but nevertheless want to extract media queries you should check out my [PostCSS plugin](https://github.com/SassNinja/postcss-extract-media-query) which supports much more tools.

However it also breaks out of the bundler/runner and emits files within the PostCSS plugin which will ignore all other pipes in your task.
So it's highly recommended to use this webpack plugin instead of the PostCSS alternative!

## Contribution

This plugin has been built because I wasn't able to find a webpack solution for such a trivial task of splitting files by media query and loading them async. It works for my use cases by I'm pretty sure it can get more improved. So if you miss any feature don't hesitate to create an issue as feature request or to create a PR to do the job.

**And last but not least, if you like this plugin please give it a star on github and share it!**

