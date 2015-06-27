var async   = require('async');
var fs      = require('fs');
var mongoose = require('mongoose');


// Resets the database (AKA Cleans it)
exports.reset = function(config, callback) {
    if (!config.server.tests.can_drop_database === false) {
        return callback("Can not drop database.");
    }

    mongoose.connect(config.database.api_server.url, function (err) {
        mongoose.connection.db.dropDatabase(function(err) {
            if (err) return callback(err);
            return callback();
        });
    });
};

exports.seed = function(config, fixtures, callback) {
    if (config.server.tests.can_init_data === false) {
        return callback();
    }

    mongoose.connect(config.database.api_server.url, function (err) {
        async.each(fixtures, function(fixture, callback) {
            if (!fixture.name || !fixture.data) {
                return callback("Collection name or fixture data was unknown.");
            }

            _insert(mongoose.connection, fixture.name, fixture.data, function(err) {
                if (err) return callback(err);
                return callback();
            });
        }, function(err) {
            if (err) return callback(err);
            return callback();
        });
    });
};

var _insert = function(connection, collectionName, data, callback) {
    var collection = connection.collection(collectionName);

    async.each(data, function (dataItem, callback) {
        collection.insert(dataItem, callback);
    }, function(err) {
        if (err) return callback(err);
        return callback();
    });
};
