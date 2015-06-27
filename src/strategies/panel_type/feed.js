var async = require('async');
var util = require('util');
var BaseStrategy = require('./baseStrategy');

function Strategy() {
    this.name = 'feed';
};

/**
 * Inherit from `BaseStrategy`
 */
util.inherits(Strategy, BaseStrategy);

Strategy.prototype.use = function(providerName) {
    var api = require('../providers');
    this.strategy = api.getFeedAPI(providerName);
};

/**
 * Get the feeds for the given UserProvider, Also automatically parse it to the unified format
 * @param {object} userProvider
 * @param {int} timeSince
 * @param {int} timeUntil
 * @param {int} limit
 * @param {object} feedCallback
 */
Strategy.prototype.getContent = function(userProvider, callback) {
    var self = this;
    var timeSince = null;
    var timeUntil = null;
    var limit = 30;

    self.strategy.getFeed(userProvider, timeSince, timeUntil, limit, function(err, posts) {
        if (err) return callback(err);
        return callback(null, posts);
    });
};

module.exports = Strategy;
