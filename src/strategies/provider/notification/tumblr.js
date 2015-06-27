'use strict';

var util                = require('util');
var BaseStrategy        = require('./baseStrategy');

/**
 * The Facebook Provider strategy wraps the Facebook API
 */
function Strategy(authStrategy, options) {
    if (!authStrategy) { throw new TypeError('FeedAPI requires an authentication strategy.') }
    if (!options.apiURL) { throw new TypeError('FeedAPI Strategy requires a apiURL option.') }

    options = options || {};
    options.apiURL = options.apiURL || 'https://graph.facebook.com/v2.1';

    BaseStrategy.call(this);

    this.name = 'facebook';
    this._apiURL = options.apiURL;

    this.authStrategy = authStrategy;
};

/**
 * Inherit from `BaseStrategy`
 */
util.inherits(Strategy, BaseStrategy);

module.exports = Strategy;
