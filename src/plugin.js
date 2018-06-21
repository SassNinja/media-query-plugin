
const pluginName = 'MediaQueryPlugin';

const store = require('./store');
const escapeUtil = require('./utils/escape');

module.exports = class MediaQueryPlugin {

    constructor(options) {
        options = Object.assign({
            include: [],
            queries: {}
        }, options);

        // save in store to provide to loader
        store.options = options;
    }

    apply(compiler) {

        compiler.hooks.compilation.tap(pluginName, compilation => {
            compilation.hooks.finishModules.tap(pluginName, (modules) => {

                for (const module of modules) {

                    const basename = module.rawRequest 
                                        ? module.rawRequest
                                            .match(/([\w-]+)(\.[\w-]+)+(\?.*)?$/)[0]
                                            .replace(/\..+$/, '')
                                        : undefined;

                    // check if store contains extraction for current basename
                    if (basename && store.hasMedia(basename)) {

                        const css = store.getMedia(basename);

                        // inject the extracted css
                        if (module._source._value.match(/exports\.push/)) {
                            const regex = /exports\.push\(\[module\.id, ".*"/gm;
                            module._source._value = module._source._value
                                                    .replace(regex, `exports.push([module.id, ${ escapeUtil(css) }`);
                        }
                    }
                }

            });
        });

    }
};
