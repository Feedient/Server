// Load modules
var dgram   = require('dgram');
var Metrics = require('./Metrics');

// Declare internals
var internals = {};
var defaultOptions = {
    port: 8881,
    host: '127.0.0.1',
    enabled: false
};

// Register the plugin
exports.register = function (plugin, options, next) {
    // Set the options
    internals.options = options || defaultOptions;

    var MetricsInstance = new Metrics(internals.options.ip, internals.options.port, internals.options.enabled);
    plugin.expose('metrics', MetricsInstance);
    plugin.log(['plugin', 'info'], exports.register.attributes.pkg.name + ' registered');

    return next();
};

// Export the plugin name and version to the registration engine
exports.register.attributes = {
    pkg: require('../package.json')
};
