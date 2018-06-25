/**
 * Bootstraper that exports the plugin and provides easy access to the loader.
 */

const loader = require('./loader');
const plugin = require('./plugin');

// provide easy access to the loader
plugin.loader = require.resolve('./loader');

// export default webpack plugin
module.exports = plugin;