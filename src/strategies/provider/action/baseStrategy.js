'use strict';

function BaseStrategy(options) {
    this._actions = options.actions || [];
};

/**
 * Check if the strategy has the action
 * @param {string} actionName
 */
BaseStrategy.prototype.hasAction = function(actionName) {
    var functions = Object.getPrototypeOf(this);

    if (typeof functions[actionName] === 'function') {
        return true;
    }

    return false;
};

module.exports = BaseStrategy;
