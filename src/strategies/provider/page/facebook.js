'use strict';

var util                = require('util');
var BaseStrategy        = require('./baseStrategy');
var async               = require('async');
var Wreck			  	= require('wreck');
var msgFormatter 	   	= require('../../../lib/msgFormatter');
var urlFormatter 	   	= require('../../../lib/urlFormatter');
var url                 = require('url');

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


Strategy.prototype.getPages = function(userProvider, callback) {
    var params = {
        access_token: userProvider.providerTokens.accessToken
    };

    var self = this;

    var parameters = urlFormatter.serialize(params);
    Wreck.get(this._apiURL + "/me/accounts?" + parameters, {  }, function (err, res, payload) {
        if (err) return callback(err);

        // Verify Access Token validity
        self.authStrategy.checkAccessToken(userProvider, payload, function (err) {
            if (err) return callback(err);

            try {
                payload = JSON.parse(payload);
            } catch (e) {
                return callback(e.message);
            }

            return callback(null, payload.data);
        });
    });
};

Strategy.prototype.processPage = function(page, userProvider) {
    var json = {};
    json.id = page.id,
    json.name = page.name;
    json.access_token = page.access_token;
    json.permissions = page.perms;

    return json;
};

module.exports = Strategy;
