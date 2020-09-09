/**
 * The PostCSS plugin component is supposed to extract the media CSS from the source chunks.
 * The CSS get saved in the store.
 */

const postcss = require('postcss');
const store = require('./store');

module.exports = postcss.plugin('MediaQueryPostCSS', options => {

    function addToStore(name, atRule) {

        const css = postcss.root().append(atRule).toString();
        const query = atRule.params;
        
        store.addMedia(name, css, options.path, query);
    }

    function getGroupName(name) {
        const groupNames = Object.keys(options.groups);

        for (let i = 0; i < groupNames.length; i++) {
            const groupName = groupNames[i];
            const group = options.groups[groupName];

            if (group instanceof RegExp) {
                if (name.match(group)) {
                    return groupName;
                }
            } else if (Array.isArray(group)) {
                if (group.includes(name)) {
                    return groupName;
                }
            }
        }
    }

    return (css, result) => {

        css.walkAtRules('media', atRule => {

            const queryname = options.queries[atRule.params];

            if (queryname) {
                const groupName = getGroupName(options.basename);
                const name = groupName ? `${groupName}-${queryname}` : `${options.basename}-${queryname}`;
                
                addToStore(name, atRule);
                atRule.remove();
            }
        });
    };
});