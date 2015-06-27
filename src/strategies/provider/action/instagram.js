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
    options.actions = options.actions || ['comment', 'deleteComment', 'like', 'unlike'];

    BaseStrategy.call(this, options);

    this.name = 'facebook';
    this._apiURL = options.apiURL;
    this.authStrategy = authStrategy;
};

/**
 * Inherit from `BaseStrategy`
 */
util.inherits(Strategy, BaseStrategy);

/**
 * Create a comment
 *
 * @api-method POST
 * @api-url    /provider/:id/actions/comment/
 * @api-body   media_id
 * @api-body   comment
 *
 * @param  {OAuth}   		OAuth
 * @param  {UserProvider}   userProvider
 * @param  {array}   		body
 * @param  {Function} 		callback
 * @return {array}
 */
Strategy.prototype.comment = function(userProvider, payloadData, callback) {
    if (!payloadData.media_id || !payloadData.comment) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    var self = this;

    var params = {
        access_token: userProvider.providerTokens.accessToken,
        text: payloadData.comment
    };

    var parameters = urlFormatter.serialize(params);
    Wreck.post('https://api.instagram.com/v1/media/' + payloadData.media_id + '/comments?' + parameters, {  }, function (err, res, payload) {
        if (err) return callback(err);

        // Verify Access Token validity
        self.authStrategy.checkAccessToken(userProvider, payload, function (err) {
            if (err) return callback(err);
            try {
                payload = JSON.parse(payload);
                return callback(null, payload.data);
            } catch (e) {
                return callback(e.message);
            }
        });
    });
};

/**
 * Deletes a comment
 *
 * @api-method POST
 * @api-url    /provider/:id/actions/deleteComment/
 * @api-body   media_id
 * @api-body   comment_id
 *
 * @param  {OAuth}   		OAuth
 * @param  {UserProvider}   userProvider
 * @param  {array}   		body
 * @param  {Function} 		callback
 * @return {array}
 */
Strategy.prototype.deleteComment = function(userProvider, payloadData, callback) {
    if (!payloadData.media_id || !payloadData.comment_id) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    var self = this;

    var params = {
        access_token: userProvider.providerTokens.accessToken
    };

    var parameters = urlFormatter.serialize(params);
    Wreck.delete('https://api.instagram.com/v1/media/' + payloadData.media_id + '/comments/' + payloadData.comment_id + '?' + parameters, {  }, function (err, res, payload) {
        if (err) return callback(err);

        // Verify Access Token validity
        self.authStrategy.checkAccessToken(userProvider, payload, function (err) {
            if (err) return callback(err);
            try {
                payload = JSON.parse(payload);
                return callback(null, payload.data);
            } catch (e) {
                return callback(e.message);
            }
        });
    });
};

/**
 * Likes a post
 *
 * @api-method POST
 * @api-url    /provider/:id/actions/like/
 * @api-body   media_id
 *
 * @param  {OAuth}   		OAuth
 * @param  {UserProvider}   userProvider
 * @param  {array}   		body
 * @param  {Function} 		callback
 * @return {array}
 */
Strategy.prototype.like = function(userProvider, payloadData, callback) {
    if (!payloadData.media_id) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    var self = this;

    var params = {
        access_token: userProvider.providerTokens.accessToken
    };

    var parameters = urlFormatter.serialize(params);
    Wreck.post('https://api.instagram.com/v1/media/' + payloadData.media_id + '/likes?' + parameters, {  }, function (err, res, payload) {
        if (err) return callback(err);

        // Verify Access Token validity
        self.authStrategy.checkAccessToken(userProvider, payload, function (err) {
            if (err) return callback(err);
            try {
                payload = JSON.parse(payload);
                return callback(null, payload.data);
            } catch (e) {
                return callback(e.message);
            }
        });
    });
};

/**
 * Unlikes a post
 *
 * @api-method POST
 * @api-url    /provider/:id/actions/unlike/
 * @api-body   media_id
 *
 * @param  {OAuth}   		OAuth
 * @param  {UserProvider}   userProvider
 * @param  {array}   		body
 * @param  {Function} 		callback
 * @return {array}
 */
Strategy.prototype.unlike = function(userProvider, payloadData, callback) {
    if (!payloadData.media_id) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    var self = this;

    var params = {
        access_token: userProvider.providerTokens.accessToken
    };

    var parameters = urlFormatter.serialize(params);
    Wreck.delete('https://api.instagram.com/v1/media/' + payloadData.media_id + '/likes?' + parameters, {  }, function (err, res, payload) {
        if (err) return callback(err);

        // Verify Access Token validity
        self.authStrategy.checkAccessToken(userProvider, payload, function (err) {
            if (err) return callback(err);
            try {
                payload = JSON.parse(payload);
                return callback(null, payload.data);
            } catch (e) {
                return callback(e.message);
            }
        });
    });
};


module.exports = Strategy;
