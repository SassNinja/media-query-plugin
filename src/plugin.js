/**
 * The plugin component is supposed to inject the extracted media CSS (from store) into the file(s).
 */

const pluginName = 'MediaQueryPlugin';

const { OriginalSource, ConcatSource } = require('webpack-sources');
const { interpolateName } = require('loader-utils');
const Chunk = require('webpack/lib/Chunk');

const store = require('./store');
const escapeUtil = require('./utils/escape');

module.exports = class MediaQueryPlugin {

    constructor(options) {
        this.options = Object.assign({
            include: [],
            queries: {}
        }, options);
    }

    getFilenameOption(compiler) {
        const plugins = compiler.options.plugins;
        let MiniCssExtractPluginOptions = {};

        for (const plugin of plugins) {
            if (plugin.constructor.name === 'MiniCssExtractPlugin') {
                MiniCssExtractPluginOptions = plugin.options || {};
            }
        }

        return MiniCssExtractPluginOptions.filename || compiler.options.output.filename;
    }

    apply(compiler) {

        // if no filename option set, use default
        this.options.filename = this.options.filename || this.getFilenameOption(compiler);

        // save options in store to provide to loader
        store.options = this.options;

        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            compilation.hooks.additionalAssets.tapAsync(pluginName, (cb) => {

                const chunks = compilation.chunks;
                const chunkIds = chunks.map(chunk => chunk.id);
                const assets = compilation.assets;

                store.getMediaKeys().forEach(mediaKey => {

                    const css = store.getMedia(mediaKey);

                    // generate hash and use for [hash] within basename
                    const hash = interpolateName({}, `[hash:${compiler.options.output.hashDigestLength}]`, { content: css });

                    // compute basename according to filename option
                    // while considering hash
                    const basename = this.options.filename
                                        .replace('[name]', mediaKey)
                                        .replace(/\[(content|chunk)?hash\]/, hash)
                                        .replace(/\.[^.]+$/, '');

                    // if there's no chunk for the extracted media, create one 
                    if (chunkIds.indexOf(mediaKey) === -1) {
                        const mediaChunk = new Chunk(mediaKey);
                        mediaChunk.id = mediaKey;
                        mediaChunk.ids = [mediaKey];
                        chunks.push(mediaChunk);
                    }

                    const chunk = chunks.filter(chunk => chunk.id === mediaKey)[0];

                    // find existing js & css files of this chunk
                    let existingFiles = { js: [], css: [] };
                    chunk.files.forEach(file => {
                        if (file.match(/\.js$/)) {
                            existingFiles.js.push(file);
                        } else if (file.match(/\.css$/)) {
                            existingFiles.css.push(file);
                        }
                    });

                    // if css included in js (style-loader), inject into js
                    if (existingFiles.js.length > 0 && existingFiles.css.length === 0) {

                        let content = new OriginalSource(`\n\n// module\nexports.push([module.i, "${escapeUtil(css)}", ""]);`, `${basename}.css`);
                        existingFiles.js.forEach(file => {
                            if (assets[file]) {
                                content = new ConcatSource(assets[file], content);
                                chunk.files.splice(chunk.files.indexOf(file), 1);
                                delete assets[file];
                            }
                        });

                        chunk.files.push(`${basename}.js`);
                        assets[`${basename}.js`] = content;
                    }

                    // else create additional css asset (new chunk)
                    // or replace existing css assert (mini-css-extract-plugin)
                    else {

                        let content = new OriginalSource(css, `${basename}.css`);
                        existingFiles.css.forEach(file => {
                            if (assets[file]) {
                                content = new ConcatSource(assets[file], content);
                                chunk.files.splice(chunk.files.indexOf(file), 1);
                                delete assets[file];
                            }
                        });

                        chunk.files.push(`${basename}.css`);
                        assets[`${basename}.css`] = content;
                    }

                });

                // restore default sort of assets object for nicer stats
                // bcz due to our injection the order got changed
                compilation.assets = Object.keys(assets).sort().reduce((res, key) => (res[key] = assets[key], res), {});

                cb();
            });
        });

    }
};
