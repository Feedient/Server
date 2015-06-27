'use strict';

function BaseStrategy(options) {
    this.name = "";
    this.strategy = null;
};

BaseStrategy.prototype.getContent = function(callback) {
    return callback(null, {});
};

BaseStrategy.prototype.getName = function() {
    return this.name;
};

/**
 * Performs the action if it exists in the current API
 */
BaseStrategy.prototype.doAction = function(userProvider, actionName, data, callback) {
    return callback(null, {});
};

module.exports = BaseStrategy;
