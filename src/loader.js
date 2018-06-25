/**
 * The loader component is supposed to extract the media CSS from the source chunks.
 * To do this it uses a custom PostCSS plugin. 
 * In the course of this the original media CSS gets removed.
 */

const { getOptions, interpolateName } = require('loader-utils');
const postcss = require('postcss');
const store = require('./store');
const plugin = require('./postcss');

module.exports = function(source) {

    // make loader async
    const cb = this.async();

    // merge loader's options with plugin's options from store
    const options = Object.assign(store.options, getOptions(this));

    // basename gets used later for key in media query store
    options.basename = interpolateName(this, '[name]', { content: '' });

    let isIncluded = false;

    // check if current file should be affected
    if (typeof options.include === 'object' && options.include.indexOf(options.basename) > -1) {
        isIncluded = true;
    } else if (options.include instanceof RegExp && options.basename.match(options.include)) {
        isIncluded = true;
    } else if (options.include === true) {
        isIncluded = true;
    }

    // return (either modified or not) source
    if (isIncluded === true) {
        postcss([ plugin(options) ])
            .process(source, { from: options.basename })
            .then(result => {
                cb(null, result.toString())
            });
    } else {
        cb(null, source);
    }
};