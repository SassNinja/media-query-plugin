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

            compilation.hooks.additionalAssets.tapAsync(pluginName, (cb) => {

                const chunks = compilation.chunks;
                const chunkIds = chunks.map(chunk => chunk.id);
                const assets = compilation.assets;

                store.getMediaKeys().forEach(mediaKey => {

                    const css = store.getMedia(mediaKey);
                    const queries = store.getQueries(mediaKey);

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

                    // add query to chunk data if available
                    // can be used to determine query of a chunk (html-webpack-plugin)
                    if (queries) {
                        chunk.query = queries[0];
                    }

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
                                chunk.files.splice(chunk.files.indexOf(file), 1);
                                delete assets[file];
                            }
                        }
                        
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
                compilation.chunks = chunks.sort(chunksCompareFn);
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
                compilation.assets = Object.keys(assets).sort(assetsCompareFn).reduce((res, key) => (res[key] = assets[key], res), {});

                cb();
            });

            // consider html-webpack-plugin and provide extracted files
            // which can be accessed in templates via htmlWebpackPlugin.files.extracted
            // { css: [{file:'',query:''},{file:'',query:''}] }
            compilation.hooks.afterOptimizeChunkAssets.tap(pluginName, (chunks) => {
                if (compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration) {
                    compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync(pluginName, (pluginArgs, cb) => {
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
                    });
                }
            });

        });

    }
};
