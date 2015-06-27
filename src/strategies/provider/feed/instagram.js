var util            = require('util');
var BaseStrategy    = require('./baseStrategy');
var Wreck 			= require('wreck');
var urlFormatter 	= require('../../../lib/urlFormatter');
var async 			= require('async');
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

    this.name = 'instagram';
    this._feedUrl = options.apiURL + '/me';

    this.authStrategy = authStrategy;
};

/**
 * Inherit from `BaseStrategy`
 */
util.inherits(Strategy, BaseStrategy);

/**
 * Gets the user his/her feed
 *
 * Note: timeSince and timeUntil are:
 *     - timeSince: MIN_ID: Return media later than this min_id.
 *     - timeUntil: MAX_ID: Return media earlier than this max_id.s
 */
Strategy.prototype.getFeed = function(userProvider, timeSince, timeUntil, limit, callback) {
    var params = {
        access_token : userProvider.providerTokens.accessToken,
        count: limit
    };

    // Implement older or newer feed posts.
    if (timeSince) params.min_id = "" + timeSince;
    if (timeUntil) params.max_id = "" + timeUntil;

    var self = this;

    var parameters = urlFormatter.serialize(params);
    Wreck.get('https://api.instagram.com/v1/users/self/feed?' + parameters, {  }, function (err, res, payload) {
        if (err) return callback(err);

        // Verify Access Token validity
        self.authStrategy.checkAccessToken(userProvider, payload, function (err) {
            if (err) return callback(err);

            try {
                payload = JSON.parse(payload);
            } catch (e) {
                return callback(e.message);
            }

            if (!payload.data) {
                return callback(null, []);
            }

            return callback(null, payload.data);
        });
    });
};

Strategy.prototype.getPost = function(userProvider, postId, callback) {
    var self = this;

    var params = {
        access_token: userProvider.providerTokens.accessToken
    };

    var parameters = urlFormatter.serialize(params);
    Wreck.get('https://api.instagram.com/v1/media/' + postId + '?' + parameters, {  }, function (err, res, payload) {
        if (err) return callback(err);

        // Verify Access Token validity
        self.authStrategy.checkAccessToken(userProvider, payload, function (err) {
            if (err) return callback(err);

            try {
                payload = JSON.parse(payload);
            } catch (e) {
                return callback(e.message);
            }

            payload = payload.data;
            return callback(null, payload);
        });
    });
};

/**
 * Gets the comments for a post
 *
 * @api-method POST
 * @api-url    /provider/:userProviderId/:postId/comments
 * @api-body   beforeTime
 * @api-body   limit
 *
 * @param  {UserProvider}   userProvider
 * @param  {int}            postId
 * @param  {array}   		body 			[Needs: body.beforeTime, body.limit]
 * @param  {Function} 		callback
 * @return {array}
 */
Strategy.prototype.getPostComments = function(userProvider, postId, beforeTime, limit, userId, callback) {
    var self = this;

    var params = {
        access_token: userProvider.providerTokens.accessToken
    };

    var parameters = urlFormatter.serialize(params);
    Wreck.get('https://api.instagram.com/v1/media/' + postId + '/comments?' + parameters, {  }, function (err, res, payload) {
        if (err) return callback(err);

        // Verify Access Token validity
        self.authStrategy.checkAccessToken(userProvider, payload, function (err) {
            if (err) return callback(err);
            try {
                payload = JSON.parse(payload);
            } catch (e) {
                return callback(e.message);
            }

            var hasMoreComments = false;

            if (payload.data) {
                hasMoreComments = payload.data.length >= 150;
            }

            return callback(null, payload.data, [], '', hasMoreComments);
        });
    });
};

/**
 * Route the avatar URL via our HTTPS proxy
 * @param String avatar
 * @return String
 */
var _getProxiedAvatarURL = function(avatar) {
    // If on one of the new domains, return the avatar
    if (/akamaihd\.net/.test(avatar)) {
        return avatar;
    }

    if (/^https?:\/\/instagramimages-a\.akamaihd\.net\/profiles\//.test(avatar)) {
        return avatar;
    }

    // images domain
    if (/^http:\/\/images\.ak\.instagram\.com\/profiles\//.test(avatar)) {
        var fileName = avatar.replace('http://images.ak.instagram.com/profiles/', '');

        return config.client.image_proxy.instagram_avatars_images + fileName;
    }

    // photos-X domain (X is a letter between A and H)
    if (/^http:\/\/photos-[a-h]\.ak\.instagram\.com\//.test(avatar)) {
        var matches = avatar.match(/http:\/\/photos-([a-h])\.ak\.instagram\.com/);
        var serverLetter = matches[1];
        var fileName = avatar.replace(matches[0] + '/', '');

        return config.client.image_proxy['instagram_avatars_photos_' + serverLetter] + fileName;
    }

    // Fallback to unknown avatar picture (to avoid broken image)
    return config.client.url + 'app/images/unknown-avatar.jpg';
};

/**
 * Process the comments to a unified format
 */
//{ created_time: '1395943314',
//    text: '<3 :D',
//    from:
//     { username: 'adrivanhoudt_',
//       profile_picture: 'http://images.ak.instagram.com/profiles/profile_436472715_75sq_1372262638.jpg',
//       id: '436472715',
//       full_name: 'Adri Van Houdt' },
//    id: '685544670203900429' }
Strategy.prototype.processComment = function(comment, accessToken) {
    var date_created = new Date(comment['created_time'] * 1000);

    var commentJSON = {
        id: comment['id'],
        user: {
            id: comment['from']['id'],
            name: comment['from']['full_name'],
            name_formatted: comment['from']['username'],
            image: _getProxiedAvatarURL(comment['from']['profile_picture']),
            profile_link: 'https://instagram.com/' + comment['from']['username']
        },
        content: {
            date_created: date_created.toISOString(),
            message: comment['text'],
            can_remove: false
        }
    };

    return commentJSON;
};

/**
 * Process the post to the unified format
 */
Strategy.prototype.processPost = function (post, userProvider) {
    var accessToken = userProvider.providerTokens.accessToken;
    var json = {};
    json.id = post['id'];
    json.post_link = post['link'];

    // User
    json.user = {};
    json.user.id = post['user']['id'];
    json.user.name = post['user']['full_name'];
    json.user.name_formatted = post['user']['username'];
    json.user.image = _getProxiedAvatarURL(post['user']['profile_picture']);
    json.user.profile_link = 'https://instagram.com/' + post['user']['username'];

    // Provider
    json.provider = {};
    json.provider.id = userProvider._id.toString();
    json.provider.name = "instagram";

    // Content
    json.content = {};
    json.content.date_created = new Date(post['created_time'] * 1000) || null;

    // Action Counts
    json.content.action_counts = {};
    json.content.action_counts.comments = (post['comments']) ? post['comments']['count'] || 0 : 0;
    json.content.action_counts.likes = post['likes']['count'] || 0;

    // Actions Performed
    json.content.actions_performed = {};
    json.content.actions_performed.liked = post['user_has_liked'] || false;

    if (post['caption']) json.content.message = post['caption']['text'];

    // Entities
    json.content.entities = {};
    json.content.entities.pictures = [];
    json.content.entities.videos = [];
    json.content.entities.hashtags = [];
    json.content.entities.mentions = [];
    json.content.entities.links = [];

    // Links
    if (post['link']) {
        var entity = {};
        entity.display_url = post['link'];
        entity.expanded_url = post['link'];

        json.content.entities.links.push(entity);
    }

    // Pictures
    if (post['images']['standard_resolution']) {
        var entity = {};
        entity.small_picture = {};
        entity.small_picture.url = post['images']['low_resolution']['url'].replace('http://', 'https://');
        entity.small_picture.width = post['images']['low_resolution']['width'];
        entity.small_picture.height = post['images']['low_resolution']['height'];

        entity.large_picture = {};
        entity.large_picture.url = post['images']['standard_resolution']['url'].replace('http://', 'https://');
        entity.large_picture.width = post['images']['standard_resolution']['width'];
        entity.large_picture.height = post['images']['standard_resolution']['height'];

        entity.caption = "";

        json.content.entities.pictures.push(entity);
    }

    // Mentions
    if (post['caption'] && post['caption']['text']) {
        var mentions = post['caption']['text'].match(/[^a-z.\/]?@([a-z0-9\_]+)/ig);

        for (var i in mentions) {
            var entity = {};
            entity.name = mentions[i].trim();
            entity.profile_link = 'https://instagram.com/' + mentions[i].trim().replace('@', '');

            json.content.entities.mentions.push(entity);
        }
    }

    // Process links with regex
    if (post['caption'] && post['caption']['text']) {
        var result = post['caption']['text'].match(/(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig);

        if (result) {
            for (var i in result) {
                var entity = {};
                entity.display_url = result[i];
                entity.expanded_url = result[i];

                json.content.entities.links.push(entity);
            }
        }
    }

    // Pagination
    json.pagination = {};
    json.pagination.since = json.id.toString();

    return json;
};

module.exports = Strategy;
