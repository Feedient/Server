'use strict';

var util                = require('util');
var BaseStrategy        = require('./baseStrategy');
var async               = require('async');
var Wreck			  	= require('wreck');
var msgFormatter 	   	= require('../../../lib/msgFormatter');
var urlFormatter 	   	= require('../../../lib/urlFormatter');
var url                 = require('url');
var Notification		= require('../../../entities/notification');
var regex				= require('../../../lib/regex');

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

Strategy.prototype.getNotifications = function(userProvider, sinceId, limit, callback) {
    var params = {
        count: limit,
        include_rts: true
    };

    if (sinceId) params.since_id = sinceId;

    var self = this;

    var parameters = urlFormatter.serialize(params);
    self.authStrategy.getOAuth().get('https://api.twitter.com/1.1/statuses/mentions_timeline.json?' + parameters, userProvider.providerTokens.accessToken, userProvider.providerTokens.accessTokenSecret, function(err, results) {
        self.authStrategy.checkAccessToken(userProvider, results, function(err) {
            if (err) return callback(err);

            try {
                results = JSON.parse(results);
            } catch (e) {
                return callback(e.message);
            }

            return callback(null, results);
        });
    });
};

Strategy.prototype.processNotification = function(notification) {
    var screenName = notification['user']['screen_name'] || "undefined";
    var postLink = 'https://twitter.com/' + screenName + '/status/' + notification['id_str'];

    var json = {};
    json.id = notification['id_str'];
    json.created_time = new Date(notification['created_at']);
    json.link = postLink;
    json.read = 0;

    // From User
    json.user_from = {};
    json.user_from.id = notification['user']['id_str'];
    json.user_from.name = notification['user']['name'];
    json.user_from.name_formatted = '@' + notification['user']['screen_name'];
    json.user_from.image = notification['user']['profile_image_url_https'];
    json.user_from.profile_link = 'https://twitter.com/' + screenName;

    // To User
//    json.user_to = {};
//    json.user_to.id = notification['user']['id_str'];
//    json.user_to.name = notification['user']['name'];
//    json.user_to.image = notification['user']['profile_image_url_https'];
//    json.user_to.profile_link = 'https://twitter.com/' + screenName;

    // Content
    json.content = {};
    json.content.message = notification['text'];

    // Pagination
    json.pagination = {};
    json.pagination.since = json.id.toString();

    return json;
};

module.exports = Strategy;
