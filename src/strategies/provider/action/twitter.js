'use strict';

var util                = require('util');
var BaseStrategy        = require('./baseStrategy');
var async               = require('async');
var Wreck			  	= require('wreck');
var msgFormatter 	   	= require('../../../lib/msgFormatter');
var urlFormatter 	   	= require('../../../lib/urlFormatter');
var requestLib 	        = require('request');
var fs                  = require('fs');

/**
 * The Facebook Provider strategy wraps the Facebook API
 */
function Strategy(authStrategy, options) {
    if (!authStrategy) { throw new TypeError('FeedAPI requires an authentication strategy.') }
    if (!options.apiURL) { throw new TypeError('FeedAPI Strategy requires a apiURL option.') }

    options = options || {};
    options.apiURL = options.apiURL || 'https://graph.facebook.com/v2.1';

    BaseStrategy.call(this, options);

    this.name = 'twitter';
    this._apiURL = options.apiURL;
    this.authStrategy = authStrategy;
};

/**
 * Inherit from `BaseStrategy`
 */
util.inherits(Strategy, BaseStrategy);

/**
 * Posts a new tweet, the tweet message is in the body defined as tweet_msg
 *
 * @api-method POST
 * @api-url    /provider/:id/actions/compose/
 * @api-body   message
 *
 * @param  {OAuth}   OAuth
 * @param  {UserProvider}   userProvider
 * @param  {object}   body = [POST] tweet_msg
 * @param  {Function} callback
 * @return {Callback}
 */
Strategy.prototype.compose = function (userProvider, payloadData, callback) {
    if (!payloadData.message) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    var maxCharLength = 140;

    // check message length
    var matches = payloadData.message.match(/(https?:\/\/(www\.)?[^\s]+|(www\.)[^\s]+)/g);
    var totalLinkLenghts = 0;
    var httpCount = 0;
    var httpsCount = 0;

    for(var matchIndex in matches) {
        totalLinkLenghts += matches[matchIndex].length;
        if ( matches[matchIndex].indexOf('https') > -1 ) {
            httpsCount += 1;
        } else {
            httpCount += 1;
        }
    }

    if ((maxCharLength - payloadData.message.length + totalLinkLenghts - (httpCount * 22) - (httpsCount * 23)) < 0) {
        return callback('errors.COMPOSE_MAX_LENGTH_EXCEEDED');
    } else {
        this.authStrategy._oauth.post('https://api.twitter.com/1.1/statuses/update.json', userProvider.providerTokens.accessToken, userProvider.providerTokens.accessTokenSecret, { status: payloadData.message }, function(err, data) {
            if (err) return callback(err);

            try {
                var data = JSON.parse(data);
            } catch (e) {
                return callback(e.message);
            }

            return callback(null, data['id_str']);
        });
    }
};

/**
 * @api-method POST
 * @api-url    /provider/:id/actions/postImage/
 * @api-body   message
 *
 * @param  {OAuth}   OAuth
 * @param  {UserProvider}   userProvider
 * @param  {object}   image, message
 * @param  {Function} callback
 * @return {Callback}
 */
Strategy.prototype.composeWithPicture = function (userProvider, payloadData, callback) {
    if (!payloadData.picture) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    // Get custom authorization header
    var authHeader = this.authStrategy._oauth.authHeader(
        'https://api.twitter.com/1.1/statuses/update_with_media.json',
        userProvider.providerTokens.accessToken,
        userProvider.providerTokens.accessTokenSecret,
        'POST'
    );

    // Start uploading
    var req = requestLib.post({ url: 'https://api.twitter.com/1.1/statuses/update_with_media.json', headers: { 'Authorization': authHeader } }, function(err, res, body) {
        if (err) return callback(err);

        try {
            body = JSON.parse(body);
        } catch (e) {
            return callback(e);
        }

        return callback(null, body.id_str);
    });

    // Pipe our data to it
    var form = req.form();
    form.append('media[]', fs.createReadStream("/tmp/" + payloadData.picture.filename));
    if (payloadData.message) form.append('status', payloadData.message);
};


/**
 * Retweets a tweet
 *
 * @api-method POST
 * @api-url    /provider/:id/actions/retweet/
 * @api-body   tweet_id
 *
 * @param  {OAuth}   		OAuth
 * @param  {UserProvider}   userProvider
 * @param  {object}   		body = [POST] tweet_id
 * @param  {Function} 		callback
 * @return {Callback}
 */
Strategy.prototype.retweet = function (userProvider, payloadData, callback) {
    if (!payloadData.tweet_id) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    this.authStrategy._oauth.post('https://api.twitter.com/1.1/statuses/retweet/' + payloadData.tweet_id + '.json', userProvider.providerTokens.accessToken, userProvider.providerTokens.accessTokenSecret, { }, function(err, data)     {
        if (err) return callback(err);
        return callback(null, data);
    });
};

/**
 * Reply to a tweet
 *
 * @api-method POST
 * @api-url    /provider/:id/actions/reply/
 * @api-body   tweet_id, tweet_reply_msg
 *
 * @param  {OAuth}   OAuth
 * @param  {UserProvider}   userProvider
 * @param  {object}   body = [POST] tweet_id, tweet_reply_msg
 * @param  {Function} callback
 * @return {Callback}
 */
Strategy.prototype.reply = function (userProvider, payloadData, callback) {
    if (!payloadData.tweet_id || !payloadData.tweet_reply_msg) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    this.authStrategy._oauth.post('https://api.twitter.com/1.1/statuses/update.json', userProvider.providerTokens.accessToken, userProvider.providerTokens.accessTokenSecret, { in_reply_to_status_id: payloadData.tweet_id, status: payloadData.tweet_reply_msg }, function(err, data) {
        if (err) return callback(err);

        try {
            var data = JSON.parse(data);
        } catch (e) {
            return callback(e.message);
        }

        return callback(null, data['id_str']);
    });
};

/**
 * Favorites a tweet
 *
 * @api-method POST
 * @api-url    /provider/:id/actions/favorite/
 * @api-body   tweet_id
 *
 * @param  {OAuth}   OAuth
 * @param  {UserProvider}   userProvider
 * @param  {Object}   body = [POST] tweet_id
 * @param  {Function} callback
 * @return {Callback}
 */
Strategy.prototype.favorite = function (userProvider, payloadData, callback) {
    if (!payloadData.tweet_id) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    this.authStrategy._oauth.post('https://api.twitter.com/1.1/favorites/create.json', userProvider.providerTokens.accessToken, userProvider.providerTokens.accessTokenSecret, { id: payloadData.tweet_id }, function(err, data) {
        if (err) return callback(err);
        return callback(null, data);
    });
};

/**
 * Delete a post or a reply
 *
 * @api-method POST
 * @api-url    /provider/:id/actions/delete/
 * @api-body   tweet_id
 *
 * @param  {OAuth}   OAuth
 * @param  {UserProvider}   userProvider
 * @param  {Object}   body = [POST] tweet_id
 * @param  {Function} callback
 * @return {Callback}
 */
Strategy.prototype.delete = function(userProvider, payloadData, callback) {
    if (!payloadData.tweet_id) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    this.authStrategy._oauth.post('https://api.twitter.com/1.1/statuses/destroy/' + payloadData.tweet_id + '.json', userProvider.providerTokens.accessToken, userProvider.providerTokens.accessTokenSecret, { }, function(err, data) {
        if (err) return callback(err);
        return callback(null, data);
    });
};

/**
 * Delete a retweet
 *
 * @api-method POST
 * @api-url    /provider/:id/actions/delete_retweet/
 * @api-body   tweet_id
 *
 * @param  {OAuth}   OAuth
 * @param  {UserProvider}   userProvider
 * @param  {Object}   body = [POST] tweet_id
 * @param  {Function} callback
 * @return {Callback}
 */
Strategy.prototype.delete_retweet = function(userProvider, payloadData, callback) {
    var self = this;
    if (!payloadData.tweet_id) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    // Get the tweet that we retweeted
    this.authStrategy._oauth.get('https://api.twitter.com/1.1/statuses/show.json?id=' + payloadData.tweet_id + '&include_my_retweet=true', userProvider.providerTokens.accessToken, userProvider.providerTokens.accessTokenSecret, function(err, result) {
        if (err) return callback(err);

        try {
            result = JSON.parse(result);
        } catch (e) {
            return callback(e.message);
        }

        // check if we got a retweet of a retweet, then delete OURS
        if (!result.current_user_retweet && result.retweeted_status != null) {
            payloadData.tweet_id = result.retweeted_status.id_str;
            return self.delete_retweet(userProvider, payloadData, callback);
        }

        // Delete the retweet on the twitter api
        this.authStrategy._oauth.post('https://api.twitter.com/1.1/statuses/destroy/' + result.current_user_retweet.id_str + '.json',
                   userProvider.providerTokens.accessToken,
                   userProvider.providerTokens.accessTokenSecret, { }, function(err, data) {
            if (err) return callback(err);
            return callback(null, data);
        });
    });
};

/**
 * Delete a favorite status of a post
 *
 * @api-method POST
 * @api-url    /provider/:id/actions/unfavorite/
 * @api-body   tweet_id
 *
 * @param  {OAuth}   OAuth
 * @param  {UserProvider}   userProvider
 * @param  {Object}   body = [POST] tweet_id
 * @param  {Function} callback
 * @return {Callback}
 */
Strategy.prototype.unfavorite = function(userProvider, payloadData, callback) {
    if (!payloadData.tweet_id) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    this.authStrategy._oauth.post('https://api.twitter.com/1.1/favorites/destroy.json', userProvider.providerTokens.accessToken, userProvider.providerTokens.accessTokenSecret, { id: payloadData.tweet_id }, function(err, data) {
        if (err) return callback(err);
        return callback(null, data);
    });
};


module.exports = Strategy;
