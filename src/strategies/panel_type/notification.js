var async = require('async');
var util = require('util');
var BaseStrategy = require('./baseStrategy');

function Strategy() {
    this.name = 'notification';
    this.strategy = null;
};

/**
 * Inherit from `BaseStrategy`
 */
util.inherits(Strategy, BaseStrategy);

Strategy.prototype.use = function(providerName) {
    var api = require('../providers');
    this.strategy = api.getNotificationAPI(providerName);
};

/**
 * Get the notifications for the given UserProvider, Also automatically parse it to the unified format
 * @param {object} userProvider
 * @param {int} timeSince
 * @param {int} limit
 * @param {object} callback
 */
Strategy.prototype.getContent = function(userProvider, callback) {
    var self = this;
    var timeSince = null;
    var limit = 30;

    self.strategy.getNotifications(userProvider, timeSince, limit, function(err, notifications) {
        if (err) return callback(err);
        return callback(null, notifications);
    });
};

module.exports = Strategy;
