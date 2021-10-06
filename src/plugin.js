/**
 * The plugin component is supposed to inject the extracted media CSS (from store) into the file(s).
 */

const pluginName = 'MediaQueryPlugin';

const { OriginalSource, ConcatSource } = require('webpack-sources');
const { interpolateName } = require('loader-utils');
const Chunk = require('webpack/lib/Chunk');
const Compilation = require('webpack/lib/Compilation');

const store = require('./store');
const escapeUtil = require('./utils/escape');

module.exports = class MediaQueryPlugin {

    constructor(options) {
        this.options = Object.assign({
            include: [],
            queries: {},
            groups: {}
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

        // reset store for every webpack instance
        // required for unit testing because the store is shared
        compiler.hooks.entryOption.tap(pluginName, () => {
            store.resetMedia();
        });

        // if a filename has become invalid (watch mode)
        // remove all related data from store
        compiler.hooks.invalid.tap(pluginName, (fileName, changeTime) => {
            store.removeMediaByFilename(fileName);
        });

        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {

            const hasDeprecatedChunks = (compilation.chunks instanceof Set) === false; // webpack < 5

            if (hasDeprecatedChunks) {
                console.warn('\n\n[WARNING] media-query-plugin is going to drop webpack 4 support with the next major version so you should consider upgrading asap!\n\n');
            }

            const processAssets = (compilationAssets, cb) => {

                const chunks = compilation.chunks;
                const chunkIds = [...chunks].map(chunk => chunk.id);
                const assets = hasDeprecatedChunks ? compilation.assets : compilationAssets;

                store.getMediaKeys().forEach(mediaKey => {

                    const css = store.getMedia(mediaKey);
                    const queries = store.getQueries(mediaKey);

                    // // generate hash and use for [hash] within basename
                    // const hash = interpolateName({}, `[hash:${compiler.options.output.hashDigestLength}]`, { content: css });

                    // // compute basename according to filename option
                    // // while considering hash
                    // const basename = this.options.filename
                    //                     .replace('[name]', mediaKey)
                    //                     .replace(/\[(content|chunk)?hash\]/, hash)
                    //                     .replace(/\.[^.]+$/, '');

                    // if there's no chunk for the extracted media, create one
                    if (chunkIds.indexOf(mediaKey) === -1) {
                        const mediaChunk = new Chunk(mediaKey);
                        mediaChunk.id = mediaKey;
                        mediaChunk.ids = [mediaKey];

                        if (hasDeprecatedChunks) {
                            chunks.push(mediaChunk);
                        } else {
                            chunks.add(mediaChunk);
                        }
                    }

                    const chunk = [...chunks].filter(chunk => chunk.id === mediaKey)[0];

                    // add query to chunk data if available
                    // can be used to determine query of a chunk (html-webpack-plugin)
                    if (queries) {
                        chunk.query = queries[0];
                    }




                    // generate hash and use for [hash] within basename
                    const hash = interpolateName({}, `[hash:${compiler.options.output.hashDigestLength}]`, { content: css });

                    // compute basename according to filename option
                    // while considering hash
                    const filename = typeof this.options.filename == 'function'
                        ? this.options.filename({ chunk })
                        : this.options.filename;

                    const basename = filename
                        .replace('[name]', mediaKey)
                        .replace(/\[(content|chunk)?hash\]/, hash)
                        .replace(/\.[^.]+$/, '');







                    // find existing js & css files of this chunk
                    let existingFiles = { js: [], css: [] };
                    [...chunk.files].forEach(file => {
                        if (file.match(/\.js$/)) {
                            existingFiles.js.push(file);
                        } else if (file.match(/\.css$/)) {
                            existingFiles.css.push(file);
                        }
                    });

                    // if css included in js (style-loader), inject into js
                    if (existingFiles.js.length > 0 && existingFiles.css.length === 0) {
                        let content;
                        const extractedContent = new OriginalSource(`\nexports.push([module.i, ${escapeUtil(css)}, ""]);\n\n\n`, `${basename}.css`);

                        for (let i = 0; i < existingFiles.js.length; i++) {
                            const file = existingFiles.js[i];

                            if (assets[file]) {
                                if (i === 0) {
                                    // since I've to inject the extracted content somewhere into the existing JS code (after `// module`)
                                    // I can't simply use ConcatSource here but need to split the raw source code first
                                    // This is only necessary for the first file/iteration
                                    const originalSource = assets[file].source();
                                    const aboveContent = new OriginalSource(originalSource.match(/[\s\S]*\/\/ module/gim)[0], `${basename}.js`);
                                    const belowContent = new OriginalSource(originalSource.match(/(\/\/\s)?exports[\s\S]*/gm)[0], `${basename}.js`);

                                    content = new ConcatSource(aboveContent, extractedContent, belowContent);
                                } else {
                                    content = new ConcatSource(assets[file], content);
                                }
                                if (hasDeprecatedChunks) {
                                    chunk.files.splice(chunk.files.indexOf(file), 1);
                                } else {
                                    chunk.files.delete(file);
                                }
                                delete assets[file];
                            }
                        }

                        if (hasDeprecatedChunks) {
                            chunk.files.push(`${basename}.js`);
                        } else {
                            chunk.files.add(`${basename}.js`);
                        }
                        assets[`${basename}.js`] = content;
                    }

                    // else create additional css asset (new chunk)
                    // or replace existing css assert (mini-css-extract-plugin)
                    else {

                        let content = new OriginalSource(css, `${basename}.css`);
                        existingFiles.css.forEach(file => {
                            if (assets[file]) {
                                content = new ConcatSource(assets[file], content);

                                if (hasDeprecatedChunks) {
                                    chunk.files.splice(chunk.files.indexOf(file), 1);
                                } else {
                                    chunk.files.delete(file);
                                }
                                delete assets[file];
                            }
                        });

                        if (hasDeprecatedChunks) {
                            chunk.files.push(`${basename}.css`);
                        } else {
                            chunk.files.add(`${basename}.css`);
                        }
                        assets[`${basename}.css`] = content;
                    }

                });

                // sort assets object for nicer stats and correct order
                // bcz due to our injection the order got changed
                const chunksCompareFn = (a, b) => {
                    if (a.id > b.id)
                        return 1;
                    else if (a.id < b.id)
                        return -1;
                    else
                        return 0;
                };
                const sortedChunks = [...chunks].sort(chunksCompareFn);

                compilation.chunks = hasDeprecatedChunks ? sortedChunks : new Set(sortedChunks);

                const assetsCompareFn = (a, b) => {
                    // take file extension out of sort
                    a = a.replace(/\.[^.]+$/, '');
                    b = b.replace(/\.[^.]+$/, '');

                    if (a > b)
                        return 1;
                    else if (a < b)
                        return -1;
                    else
                        return 0;
                };
                const sortedAssets = Object.keys(assets).sort(assetsCompareFn).reduce((res, key) => (res[key] = assets[key], res), {});

                if (hasDeprecatedChunks) {
                    compilation.assets = sortedAssets;
                } else {
                    compilationAssets = sortedAssets;
                }

                cb();
            };

            // Since webpack 4 doesn't have the processAssets hook, we need the following condition.
            // In future (once webpack 4 support has been dropped) this can be simplified again.
            if (hasDeprecatedChunks) {
                compilation.hooks.additionalAssets.tapAsync(pluginName, (cb) => {
                    processAssets(compilation.assets, cb);
                });
            } else {
                compilation.hooks.processAssets.tapAsync({
                    name: pluginName,
                    stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
                }, (assets, cb) => {
                    processAssets(assets, cb);
                });
            }

            // consider html-webpack-plugin and provide extracted files
            // which can be accessed in templates via htmlWebpackPlugin.files.extracted
            // { css: [{file:'',query:''},{file:'',query:''}] }

            try {
                const htmlWebpackPlugin = require('html-webpack-plugin');

                compilation.hooks.afterOptimizeChunkAssets.tap(pluginName, (chunks) => {

                    const hookFn = (pluginArgs, cb) => {
                        const assetJson = [];
                        const extracted = {};

                        chunks.forEach(chunk => {
                            const query = chunk.query;

                            chunk.files.forEach(file => {
                                const ext = file.match(/\w+$/)[0];

                                if (query) {
                                    extracted[ext] = extracted[ext] || [];
                                    extracted[ext].push({
                                        file: file,
                                        query: query
                                    });
                                }
                                assetJson.push(file);
                            });
                        });

                        pluginArgs.assets.extracted = extracted;
                        pluginArgs.plugin.assetJson = JSON.stringify(assetJson);
                        cb();
                    };

                    if (htmlWebpackPlugin.getHooks) {
                        htmlWebpackPlugin.getHooks(compilation).beforeAssetTagGeneration.tapAsync(pluginName, hookFn);
                    } else if (compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration) {
                        compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync(pluginName, hookFn);
                    }
                });
            } catch (err) {
                if (err.code !== 'MODULE_NOT_FOUND') {
                    throw err;
                }
            }

        });

    }
};
