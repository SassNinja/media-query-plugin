/**
 * The loader component is supposed to extract the media CSS from the source chunks.
 * To do this it uses a custom PostCSS plugin.
 * In the course of this the original media CSS gets removed.
 */

const { getOptions, interpolateName } = require('loader-utils');
const postcss = require('postcss');
const store = require('./store');
const plugin = require('./postcss');

module.exports = function (source) {

    // make loader async
    const cb = this.async();

    // merge loader's options with plugin's options from store
    const options = Object.assign(store.options, getOptions(this));

    // basename gets used later to build the key for media query store
    options.basename = interpolateName(this, '[name]', {});

    // path gets used later to invalidate store (watch mode)
    // (don't use options.filename to avoid name conflicts)
    options.path = interpolateName(this, '[path][name].[ext]', {});


    // get responding EntryPoint name
    // for those using <Object> Entries
    let webpackEntryPoint = '';
    this._compilation.entries.forEach(entry => {
        entry.dependencies.forEach(file => {

            const FileEntry = file.request;
            let FileEntry_Resolved = '';

            if (FileEntry.startsWith("/") ||
                (FileEntry.length > 1 && FileEntry[1] === ":")
            ) {
                FileEntry_Resolved = FileEntry;
            } else {
                FileEntry_Resolved = this.rootContext + FileEntry.replace(/^.\//, '/');
            }

            if ('' == webpackEntryPoint && FileEntry_Resolved === options.path) {
                webpackEntryPoint = entry.options.name;
            }
        });
    });
    options.entrypoint = webpackEntryPoint;


    let isIncluded = false;

    // check if current file should be affected
    if (options.include === true) {
        isIncluded = true;
    } else {
        if (1 == Object.keys(this._compilation.entries).length) {
            if (options.include instanceof Array && options.include.indexOf(options.basename) !== -1) {
                isIncluded = true;
            } else if (options.include instanceof RegExp && options.basename.match(options.include)) {
                isIncluded = true;
            }
        }
        else {
            if (options.include instanceof Array && options.include.indexOf(options.entrypoint) !== -1) {
                isIncluded = true;
            } else if (options.include instanceof RegExp && options.entrypoint.match(options.include)) {
                isIncluded = true;
            }
        }
    }

    // return (either modified or not) source
    if (isIncluded === true) {
        postcss([plugin(options)])
            .process(source, { from: options.basename })
            .then(result => {
                cb(null, result.toString())
            });
    } else {
        cb(null, source);
    }
};