/**
 * The store component is supposed to transfer the extracted CSS from the loader to the plugin.
 * Besides it also provides the plugin's options to the loader (as default options).
 */

class MediaQueryStore {

    constructor() {
        this.media = {};
        this.options = {};
    }

    addMedia(key, css) {
        if (typeof this.media[key] !== 'object') {
            this.media[key] = [];
        }
        this.media[key].push(css);
    }

    hasMedia(key) {
        return !!this.media[key];
    }

    getMedia(key) {
        return this.media[key].join('\n');
    }
};

module.exports = new MediaQueryStore();