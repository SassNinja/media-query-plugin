
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