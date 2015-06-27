// IMPORTANT: 20 April 2015, Strategy.prototype.GetFeed will be deprecated, we are waiting for a new implementation from YouTube

var util            = require('util');
var BaseStrategy    = require('./baseStrategy');
var Wreck          = require('wreck');
var urlFormatter    = require('../../../lib/urlFormatter');
var msgFormatter    = require('../../../lib/msgFormatter');
var async           = require('async');
var config          = require('../../../../config/app');

/**
 * The Facebook Provider strategy wraps the Facebook API
 */
function Strategy(authStrategy, options) {
    if (!authStrategy) { throw new TypeError('FeedAPI requires an authentication strategy.') }
    if (!options.apiURL) { throw new TypeError('FeedAPI Strategy requires a apiURL option.') }

    options = options || {};
    options.apiURL = options.apiURL || 'https://graph.facebook.com/v2.1';

    BaseStrategy.call(this);

    this.name = 'youtube';
    this._feedUrl = options.apiURL + '/me';
    this.authStrategy = authStrategy;
};

/**
 * Inherit from `BaseStrategy`
 */
util.inherits(Strategy, BaseStrategy);


Strategy.prototype.getPost = function(userProvider, postId, callback) {
    var self = this;

    var params = {
        part: 'id,statistics',
        id: postId,
        key: config.providers.youtube.developer_key,
    };

    var headers = {
        "Authorization": "Bearer " + userProvider.providerTokens.accessToken
    };

    var parameters = urlFormatter.serialize(params);
    Wreck.get('https://www.googleapis.com/youtube/v3/videos?' + parameters, { headers: headers  }, function (err, res, payload) {
        if (err) return callback(err);
        self.authStrategy.checkAccessToken(userProvider, payload, function(err, newUserProvider) {
            if (err) return callback(err);
            if (newUserProvider != null) return callback({ providerId: userProvider._id });

            var payloadParsed = JSON.parse(payload);

            if (!payloadParsed.items || !payloadParsed.items.length || !payloadParsed.items[0].statistics) {
                return callback('errors.FORM_EMPTY_FIELDS');
            }

            return callback(null, payloadParsed.items[0]);
        });
    });
};

Strategy.prototype.getFeed = function (userProvider, timeSince, timeUntil, limit, callback, tryAgain) {
    var self = this;
    var shouldTryAgain = (tryAgain != null) ? tryAgain : true;

    var params = {
        alt : 'json',
        orderby: 'published',
        access_token: userProvider.providerTokens.accessToken
    };

    var headers = {
        "X-GData-Key": "key=" + config.providers.youtube.developer_key
    };
    // Implement older or newer feed posts.
    if (timeSince) params.min_id = "" + timeSince;
    if (timeUntil) params['start-index'] = timeUntil;

    var parameters = urlFormatter.serialize(params);
    Wreck.get('https://gdata.youtube.com/feeds/api/users/' + userProvider.providerAccount.channelId + '/newsubscriptionvideos?' + parameters, { headers: headers  }, function (err, res, payload) {
        if (err) return callback(err);
        self.authStrategy.checkAccessToken(userProvider, payload, function(err, newUserProvider) {
            if (err) return callback(err);
            if (newUserProvider != null && shouldTryAgain) return self.getFeed(newUserProvider, timeSince, timeUntil, limit, callback, false);
            // If tryAgain is false, then we tried regetting the feed and that failed, let the user revalidate
            if (newUserProvider != null && shouldTryAgain === false) return callback({ providerId: userProvider._id });

            try {
                var payloadParsed = JSON.parse(payload);
            } catch (e) {
                return callback(e.message);
            }

            // Set the pagination id
            if (payloadParsed['feed']['entry']) {
                for (var i = 0; i < payloadParsed['feed']['entry'].length; i++) {
                    payloadParsed['feed']['entry'][i].pagination_id = payloadParsed['feed']['openSearch$startIndex']['$t'] + i + 1;
                }
            }

            return callback(null, payloadParsed['feed']['entry']);
        });
    });
};

var _orderPostsByDateCreated = function(a, b) {
    var timeA = new Date(a['content']['date_created']);
    var timeB = new Date(b['content']['date_created']);

    return timeB.getTime() - timeA.getTime();
};

var _isSupported = function (post, timeSince) {
    if (post['snippet']['type'] != 'upload') {
        return false;
    }

    if (timeSince && timeSince > 0) {
        var publishedTime = new Date(post['snippet']['publishedAt']);
        var timeSinceParsed = new Date(timeSince);

        if (publishedTime.getTime() <= timeSinceParsed.getTime()) {
            return false;
        }
    }

    return true;
};

Strategy.prototype.processPost = function (post, userProvider) {
    // Process Video Kind youtube#video differently
    if (post.kind && post.kind == 'youtube#video') {
        var json = {};
        json.id = post.id;
        json.content = {};
        json.content.action_counts = {};
        json.content.action_counts.views = post.statistics.viewCount || 0;
        json.content.action_counts.likes = post.statistics.likeCount || 0;
        json.content.action_counts.dislikes = post.statistics.dislikeCount || 0;
        json.content.action_counts.comments = post.statistics.commentCount || 0;
        json.content.action_counts.favorites = post.statistics.favoriteCount || 0;

        return json;
    }

    // Profile Picture: http://gdata.youtube.com/feeds/api/users/TEDxTalks?fields=yt:username,media:thumbnail&alt=json
    // Channel Title: post['snippet']['channelTitle'].replace(/\s+/g, '');
    var urlRegex = /(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    var videoId = (post.id && post.id.$t) ? post.id.$t.replace('http://gdata.youtube.com/feeds/api/videos/', '') : "";
    var viewCount = (post['yt$statistics']) ? post['yt$statistics']['viewCount'] || 0 : 0;
    var likeCount = (post['yt$statistics']) ? post['yt$statistics']['likeCount'] || 0 : 0;
    var dislikeCount = (post['yt$statistics']) ? post['yt$statistics']['dislikeCount'] || 0 : 0;

    var urls = post['content']['$t'].match(urlRegex);

    var json = {};
    json.id = videoId;
    json.post_link = 'http://www.youtube.com/watch?v=' + videoId;

    // User
    json.user = {};
    json.user.id = post['author'][0]['uri']['$t'].replace('https://gdata.youtube.com/feeds/api/users/', '');
    json.user.name = post['author'][0]['name']['$t'];
    json.user.name_formatted = 'has uploaded a video';
    json.user.profile_link = post['author'][0]['uri']['$t'].replace('https://gdata.youtube.com/feeds/api/users/', 'https://www.youtube.com/user/');

    // Provider
    json.provider = {};
    json.provider.id = userProvider._id.toString();
    json.provider.name = "youtube";

    // Content
    json.content = {};
    json.content.date_created = new Date(post['published']['$t']);

    // actions performed
    json.content.actions_performed = {};
    json.content.actions_performed.liked = false;
    json.content.actions_performed.disliked = false;

    // Action Counts
    json.content.action_counts = {};
    json.content.action_counts.views = viewCount || 0;
    json.content.action_counts.likes = likeCount || 0;
    json.content.action_counts.dislikes = dislikeCount || 0;

    //Correct youtube viewcount
    if (json.content.action_counts.views == 301) {
        json.content.action_counts.views = '301+';
    };

    // Entities
    json.content.entities = {};
    json.content.entities.pictures = [];
    json.content.entities.videos = [];
    json.content.entities.hashtags = [];
    json.content.entities.mentions = [];
    json.content.entities.links = [];

    // Entity Video
    json.content.entities.extended_video = {};
    json.content.entities.extended_video.link = 'https://www.youtube.com/watch?v=' + videoId;
    json.content.entities.extended_video.thumbnail = post['media$group']['media$thumbnail'][0]['url'];
    json.content.entities.extended_video.title = post['title']['$t'];
    json.content.entities.extended_video.description = post['content']['$t'];
    json.content.entities.extended_video.duration = post['media$group']['yt$duration']['seconds'] || 0;

    if (urls && urls.length > 0) {
        for (var i in urls) {
            var entity = {};
            entity.expanded_url = urls[i];
            entity.display_url = urls[i];

            json.content.entities.links.push(entity);
        }
    }

    // Pagination
    json.pagination_id = post.pagination_id;
    json.pagination = {};
    json.pagination.since = json.content.date_created.toString();

    return json;
};

module.exports = Strategy;
