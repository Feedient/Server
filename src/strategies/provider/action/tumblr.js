'use strict';

var util                = require('util');
var BaseStrategy        = require('./baseStrategy');
var async               = require('async');
var Wreck			  	= require('wreck');
var msgFormatter 	   	= require('../../../lib/msgFormatter');
var urlFormatter 	   	= require('../../../lib/urlFormatter');
var tumblr              = require('tumblr.js');
var config              = require('../../../../config/app');

/**
 * The Facebook Provider strategy wraps the Facebook API
 */
function Strategy(authStrategy, options) {
    if (!authStrategy) { throw new TypeError('FeedAPI requires an authentication strategy.') }
    if (!options.apiURL) { throw new TypeError('FeedAPI Strategy requires a apiURL option.') }

    options = options || {};
    options.apiURL = options.apiURL || 'https://graph.facebook.com/v2.1';

    BaseStrategy.call(this, options);

    this.name = 'tumblr';
    this._apiURL = options.apiURL;
    this.authStrategy = authStrategy;
};

/**
 * Inherit from `BaseStrategy`
 */
util.inherits(Strategy, BaseStrategy);

/**
 * Compose message
 * Only supports text post atm
 * Finds all hashtags in a post
 */
Strategy.prototype.compose = function(userProvider, payloadData, callback) {
    if (!payloadData.message) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    var client = tumblr.createClient({
        consumer_key: config.providers.tumblr.CONSUMER_KEY,
        consumer_secret: config.providers.tumblr.CONSUMER_SECRET,
        token: userProvider.providerTokens.accessToken,
        token_secret: userProvider.providerTokens.accessTokenSecret
    });

    // find all the tags
    var words = payloadData.message.split(' ');
    var tags = [];

    async.each(words,
        function(word, callback) {
            if(word.indexOf('#') == 0) {
                tags.push(word.substring(1, word.length));
            }
        },
        function(err){
            callback(err);
        }
    );

    if(tags.toString() == '') {
        var options = {body: payloadData.message};
    } else {
        var options = {tags: tags.toString(), body: payloadData.message};
    }

    // for now always text but can be any type
    client.text(userProvider.providerUserId, options, function(err, resp) {
        if(err) return callback(err);
        return callback(null, resp.id);
    });
};

/**
 * Reblog a post
 * Can't be undone (except if you delte the post)
 * Requires reblog_key
 */
Strategy.prototype.reblog = function(userProvider, payloadData, callback) {
    if (!payloadData.media_id || !payloadData.reblog_key) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

     var client = tumblr.createClient({
        consumer_key: config.providers.tumblr.CONSUMER_KEY,
        consumer_secret: config.providers.tumblr.CONSUMER_SECRET,
        token: userProvider.providerTokens.accessToken,
        token_secret: userProvider.providerTokens.accessTokenSecret
    });

    var options = {
        id: payloadData.media_id,
        reblog_key: payloadData.reblog_key
    }

    client.reblog(userProvider.providerUserId, options , function(err, resp) {
        if(err) return callback(err);
        return callback(null, resp);
    });
};

/**
 * Like a post
 * Requires reblog_key
 */
Strategy.prototype.like = function(userProvider, payloadData, callback) {
    if (!payloadData.media_id || !payloadData.reblog_key) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

     var client = tumblr.createClient({
        consumer_key: config.providers.tumblr.CONSUMER_KEY,
        consumer_secret: config.providers.tumblr.CONSUMER_SECRET,
        token: userProvider.providerTokens.accessToken,
        token_secret: userProvider.providerTokens.accessTokenSecret
    });

    client.like(payloadData.media_id, payloadData.reblog_key, function(err, resp) {
        if(err) return callback(err);
        return callback(null, resp);
    });
};

/**
 * Unlike a post
 * Resuires reblog_key
 */
Strategy.prototype.unlike = function(userProvider, payloadData, callback) {
    if (!payloadData.media_id || !payloadData.reblog_key) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

     var client = tumblr.createClient({
        consumer_key: config.providers.tumblr.CONSUMER_KEY,
        consumer_secret: config.providers.tumblr.CONSUMER_SECRET,
        token: userProvider.providerTokens.accessToken,
        token_secret: userProvider.providerTokens.accessTokenSecret
    });

    client.unlike(payloadData.media_id, payloadData.reblog_key, function(err, resp) {
        if(err) return callback(err);
         return callback(null, resp);
    });
};


module.exports = Strategy;
