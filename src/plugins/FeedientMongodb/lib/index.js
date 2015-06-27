'use strict';

var mongodb     = require('mongodb');
var MongoClient = mongodb.MongoClient;

exports.register = function (plugin, options, next) {
    MongoClient.connect(options.url, options.settings || {}, function (err, db) {
        if (err) return next(err);
        plugin.expose(db);
        plugin.log(['plugin', 'info'], exports.register.attributes.pkg.name + ' registered');
        return next();
    });
};

exports.register.attributes = {
    name: 'FeedientMongoDB',
    version: '1.0.0'
};

// Export the plugin name and version to the registration engine
exports.register.attributes = {
    pkg: require('../package.json')
};
