'use strict';

var util                = require('util');
var BaseStrategy        = require('./baseStrategy');
var async               = require('async');
var Wreck			  	= require('wreck');
var msgFormatter 	   	= require('../../../lib/msgFormatter');
var urlFormatter 	   	= require('../../../lib/urlFormatter');

/**
 * The Facebook Provider strategy wraps the Facebook API
 */
function Strategy(authStrategy, options) {
    if (!authStrategy) { throw new TypeError('FeedAPI requires an authentication strategy.') }
    if (!options.apiURL) { throw new TypeError('FeedAPI Strategy requires a apiURL option.') }

    options = options || {};
    options.apiURL = options.apiURL || 'https://graph.facebook.com/v2.1';

    BaseStrategy.call(this, options);

    this.name = 'youtube';
    this._apiURL = options.apiURL;
    this.authStrategy = authStrategy;
};

/**
 * Inherit from `BaseStrategy`
 */
util.inherits(Strategy, BaseStrategy);

/**
 * Like a post
 * Requires reblog_key
 */
Strategy.prototype.like = function(userProvider, payloadData, callback) {
   if (!payloadData.media_id) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    var self = this;

    var params = {
        access_token: userProvider.providerTokens.accessToken,
        id: payloadData.media_id,
        rating: 'like'
    };

    var parameters = urlFormatter.serialize(params);
    Wreck.post('https://www.googleapis.com/youtube/v3/videos/rate?' + parameters, {  }, function (err, res, payload) {
        if (err) return callback(err);
        if (!payload) return(null, {});

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

/**
 * dislike a post
 * Resuires reblog_key
 */
Strategy.prototype.dislike = function(userProvider, payloadData, callback) {
    if (!payloadData.media_id) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    var self = this;

    var params = {
        access_token: userProvider.providerTokens.accessToken,
        id: payloadData.media_id,
        rating: 'dislike'
    };

    var parameters = urlFormatter.serialize(params);
    Wreck.post('https://www.googleapis.com/youtube/v3/videos/rate?' + parameters, {  }, function (err, res, payload) {
        if (err) return callback(err);
        if (!payload) return(null, {});

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

/**
 * Remove rating
 */
Strategy.prototype.unlike = function(userProvider, payloadData, callback) {
    if (!payloadData.media_id) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    var self = this;

    var params = {
        access_token: userProvider.providerTokens.accessToken,
        id: payloadData.media_id,
        rating: 'none'
    };

    var parameters = urlFormatter.serialize(params);
    Wreck.post('https://www.googleapis.com/youtube/v3/videos/rate?' + parameters, {  }, function (err, res, payload) {
        if (err) return callback(err);
        if (!payload) return(null, {});

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

module.exports = Strategy;
