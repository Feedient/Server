var async = require('async');
var util = require('util');
var BaseStrategy = require('./baseStrategy');

function Strategy() {
    this.name = 'page';
    this.strategy = null;
};

/**
 * Inherit from `BaseStrategy`
 */
util.inherits(Strategy, BaseStrategy);

Strategy.prototype.use = function(providerName) {
    var api = require('../providers');
    this.strategy = api.getPagesAPI(providerName);
};

Strategy.prototype.getContent = function(userProvider, callback) {
    var self = this;

    self.strategy.getPages(userProvider, function(err, pages) {
        if (err) return callback(err);
        return callback(null, pages);
    });
};

module.exports = Strategy;
