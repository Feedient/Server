'use strict';

var util                = require('util');
var BaseStrategy        = require('./baseStrategy');

/**
* The Facebook Provider strategy wraps the Facebook API
*/
function Strategy(authStrategy, options) {
    if (!authStrategy) { throw new TypeError('FeedAPI requires an authentication strategy.') }

    options = options || {};

    BaseStrategy.call(this);

    this.authStrategy = authStrategy;
};

/**
* Inherit from `BaseStrategy`
*/
util.inherits(Strategy, BaseStrategy);

module.exports = Strategy;
