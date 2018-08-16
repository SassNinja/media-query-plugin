/**
 * The store component is supposed to transfer the extracted CSS from the loader to the plugin.
 * Besides it also provides the plugin's options to the loader (as default options).
 */

class MediaQueryStore {

    constructor() {
        this.media = {};
        this.options = {};
    }

    addMedia(key, css, filename, query) {
        const data = {
            css: css,
            filename: filename,
            query: query
        };

        if (typeof this.media[key] !== 'object') {
            this.media[key] = [];
        }
        this.media[key].push(data);
    }

    getMedia(key) {
        // create css array from media[key] data
        // which has the structure [{css:'',filename:'',query:''},{css:'',filename:'',query:''}]
        const css = this.media[key].map(data => data.css);

        return css.join('\n');
    }

    getQueries(key) {
        // create queries array from media[key] data
        // which can be used to determine the used query for a key
        const queries = this.media[key].map(data => data.query);

        return queries;
    }

    removeMediaByFilename(filename) {
        this.getMediaKeys().forEach(key => {
            this.media[key] = this.media[key].filter(media => media.filename !== filename);
            if (this.media[key].length === 0) {
                delete this.media[key];
            }
        });
    }

    resetMedia() {
        this.media = {};
    }

    getMediaKeys() {
        return Object.keys(this.media);
    }
};

module.exports = new MediaQueryStore();