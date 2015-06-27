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
    this._notificationsURL = options.apiURL + '/me/notifications';
    this._fieldsNotifications = 'to{link,id,name},from{link,id,name},created_time,updated_time,title,link,unread';

    this.authStrategy = authStrategy;
};

/**
 * Inherit from `BaseStrategy`
 */
util.inherits(Strategy, BaseStrategy);

/**
 * Gets the user his/her notifications
 */
Strategy.prototype.getNotifications = function(userProvider, timeSince, limit, callback) {
    var params = {
        access_token: userProvider.providerTokens.accessToken,
        include_read: true,
        fields: this._fieldsNotifications
    };

    var self = this;
    if (timeSince) params.since = timeSince;

    var parameters = urlFormatter.serialize(params);
    Wreck.get(self._notificationsURL + '?' + parameters, { timeout: 1000 * 30 }, function (err, res, payload) {
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

/**
 * Process the notification to a unified format
 *
 *{
 *	"id": "notif_1470077194_88449514",
 *	"from": {
 *		"category": "Website",
 *		"name": "Gamedevtuts+",
 *		"id": "324252407657572"
 *	},
 *	"to": {
 *		"id": "1470077194",
 *		"name": "Xavier Geerinck"
 *	},
 *	"created_time": "2014-04-05T17:07:29+0000",
 *	"updated_time": "2014-04-05T17:07:29+0000",
 *	"title": "Gamedevtuts+ added a new photo: \"How to Fund Your Indie Game...\"",
 *	"link": "http://www.facebook.com/gamedevtuts/photos/np.88449514.1470077194/625130514236425/?type=1",
 *	"unread": 1,
 *	"object": {
 *		"id": "625130514236425",
 *		"name": "How to Fund Your Indie Game\nhttp://enva.to/1jgT62O\nThey say indie game developers must wear many hats. Well, if your studio is in need of a cash infusion, it's high-time you don another fedora: that of the pro-fundraiser. But before you start calling up your long lost relatives or sell your Blu-ray collection on eBay, it's imperative that you first asset your development budget. And that will require a bit of guesswork. \n\nHere are a few helpful tips to ease the process.",
 *		"created_time": "2014-04-05T17:07:14+0000"
 *	}
 *}
 */
Strategy.prototype.processNotification = function(notification, userProvider) {
    var accessToken = userProvider.providerTokens.accessToken;

    var json = {};
    json.id = notification['id'];
    json.created_time = new Date(notification['created_time']);
    json.link = notification['link'];
    json.read = (notification['unread'] == 1) ? 0 : 1;

    // From User
    json.user_from = {};

    if (notification['from']) {
        json.user_from.name = notification['from']['name'] || "";
        json.user_from.id = notification['from']['id'] || "";
        json.user_from.image = this._apiURL + '/' + notification['from']['id'] + '/picture?access_token=' + accessToken || "";
        json.user_from.profile_link = notification['from']['link'] || "";
    } else {
        json.user_from.name = "";
        json.user_from.id = "";
        json.user_from.image = "";
        json.user_from.profile_link = "";
    }

    // To User
    json.user_to = {};

    if (notification['to']) {
        json.user_to.name = notification['to']['name'] || "";
        json.user_to.id = notification['to']['id'] || "";
        json.user_to.image = this._apiURL + '/' + notification['to']['id'] + '/picture?access_token=' + accessToken || "";
        json.user_to.profile_link = notification['to']['link'] || "";
    } else {
        json.user_to.name = "";
        json.user_to.id = "";
        json.user_to.image = "";
        json.user_to.profile_link = "";
    }

    // Content
    json.content = {};
    json.content.message = notification['title'];

    // Pagination
    json.pagination = {};
    json.pagination.since = (Math.round(new Date(json.created_time.toString()).getTime() / 1000)).toString(); // Get unix time

    return json;
};

module.exports = Strategy;
