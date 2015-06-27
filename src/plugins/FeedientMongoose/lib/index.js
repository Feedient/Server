'use strict';

var mongodb     = require('mongodb');
var mongoose    = require('mongoose');

exports.register = function (plugin, options, next) {
    mongoose.connect(options.url, function (err) {
        if (err) return next(err);
        plugin.expose(mongoose.connection);
        plugin.log(['plugin', 'info'], exports.register.attributes.pkg.name + ' registered');
        return next();
    });
};

exports.register.attributes = {
    name: 'FeedientMongoose',
    version: '1.0.0'
};

// Export the plugin name and version to the registration engine
exports.register.attributes = {
    pkg: require('../package.json')
};
