# Media Query Plugin

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

The plugin comes together with a loader which takes care of the CSS extraction from the source and provides it for the injection afterwards. You are able to override the plugin options via the loader options. But usually this shouldn't be necessary and can be left empty.

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

Add the plugin to your webpack config. It will inject the extracted CSS of the loader after the compilation.
The two options `include` and `queries` are required for the plugin to work and get explained later.

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

### 3. Extracted Files

If you use dynamic imports, webpack will try to resolve that import and throw an error if the file does not exist. Thus you have to create those empty files manually in the same folder(s) as the source file which generates the CSS.

**Important:** the names of those files must follow the pattern `[source name]-[query name]` so an example file could be `example-desktop.scss`. If you don't do this the plugin will extract the specified media queries from the source file but not inject them anywhere.

Afterwards you can simply do this in your JavaScript and webpack will take care of the rest for you

```javascript
import(/* webpackChunkName: 'example' */ './example.scss');

if (window.innerWidth >= 1200) {
    import(/* webpackChunkName: 'example-desktop' */ './example-desktop.scss');
}
```

## Options

As mentioned earlier there are two options required (either via plugin or via loader options)

### include

Each chunk (which uses the loader) gets checked if its name matches this option. In case of a match each query specified in the `queries` options gets extracted from the chunk.

Possible types
- array (e.g. `[example]`)
- regex (e.g. `/example/`)
- boolean (e.g. `true`)

### queries

This option tells the plugin which media queries are supposed to get extracted. If a media query doesn't match it'll stay untouched. Otherwise it gets extracted and afterwards injected into the chunk with the name `[source name]-[query name]`.

**Important:** make sure the keys match 100% the source CSS excl the `@media`.

**Tip:** you can use the same name for different media queries to concatenate them (e.g. desktop portrait and desktop landscape)

```javasript
queries: {
    'print, screen and (max-width: 60em) and (orientation: portrait)': 'desktop',
    'print, screen and (max-width: 60em) and (orientation: landscape)': 'desktop'
}
```

## Not using webpack?

This plugin is built for webpack only and can't be used with other module bundlers (such as [FuseBox](https://fuse-box.org/)) or task runners (such as [Gulp](https://gulpjs.com/)). However if you can't or don't want to use webpack but nevertheless want to extract media queries you should check out my [PostCSS plugin](https://github.com/SassNinja/postcss-extract-media-query) which supports much more tools.

However it also breaks out of the bundler/runner and emits files within the PostCSS plugin which will ignore all other pipes in your task.
So it's highly recommended to use this webpack plugin instead of the PostCSS alternative!

## Contribution

This plugin has been built because I wasn't able to find a webpack solution for such a trivial task of loading media queries async. It works for my use cases by I'm pretty sure it can get more improved. So if you miss any feature don't hesitate to create an issue as feature request or to create a PR to do the job.

**And last but not least, if you like this plugin please give it a star on github and share it!**

