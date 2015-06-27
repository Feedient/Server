'use strict';

var util            = require('util');
var BaseStrategy    = require('./baseStrategy');
var async           = require('async');
var Wreck			= require('wreck');
var msgFormatter 	= require('../../../lib/msgFormatter');
var urlFormatter 	= require('../../../lib/urlFormatter');
var url             = require('url');
var regex			= require('../../../lib/regex');

/**
 * The Facebook Provider strategy wraps the Facebook API
 */
function Strategy(authStrategy, options) {
    if (!authStrategy) { throw new TypeError('FeedAPI requires an authentication strategy.') }
    if (!options.apiURL) { throw new TypeError('FeedAPI Strategy requires a apiURL option.') }

    options = options || {};
    options.apiVersion = options.apiVersion || 'v2.2'
    options.apiURL = options.apiURL || 'https://graph.facebook.com/';
    options.pagesURL = options.pagesURL || 'https://www.facebook.com/pages';

    BaseStrategy.call(this);

    this.name = 'facebook';
    this._apiURL = options.apiURL + '/' + options.apiVersion;
    this._apiVersion = options.apiVersion;
    this._feedUrl = options.apiURL + '/me';
    this._fieldsFeed = 'object_id,id,created_time,type,story,to,message_tags,status_type,picture,name,full_picture,caption,source,properties,with_tags,description,link,comments,likes{id,name},from,message,shares,actions,place';

    this._pagesURL = options.pagesURL;

    this.authStrategy = authStrategy;
};

/**
 * Inherit from `BaseStrategy`
 */
util.inherits(Strategy, BaseStrategy);

/**
 * Gets the user his/her feed
 */
Strategy.prototype.getFeed = function(userProvider, timeSince, timeUntil, limit, feedCallback) {
    var self = this;
    var params = { };
    if (timeSince) params.since = timeSince;
    if (timeUntil) params.until = timeUntil;

    // construct base JSON result
    var posts = [];

    // Get new posts + check if user likes
    _getPosts(self.authStrategy, userProvider, this._apiURL, this._fieldsFeed, null, params, function(err, result) {
        if (err) return feedCallback(err);

        for (var i in result) {
            // Do not process if the post ain't supported
            if (!_isPostSupported(result[i])) {
                continue;
            }

            // Add it to the array
            posts.push(result[i]);
        }

        // Return the results
        return feedCallback(null, posts);
    });
};

Strategy.prototype.getPost = function(userProvider, postId, callback) {
    var self = this;

    var params = {
        access_token: userProvider.providerTokens.accessToken
    };

    var parameters = urlFormatter.serialize(params);
    Wreck.get(this._apiURL + "/"+ postId + '?' + parameters, {  }, function (err, res, payload) {
        if (err) return callback(err);

        // Verify Access Token validity
        self.authStrategy.checkAccessToken(userProvider, payload, function (err) {
            if (err) return callback(err);

            try {
                payload = JSON.parse(payload);
            } catch (e) {
                return callback(e.message);
            }

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
    var beforeTime = beforeTime || 0;
    var limit = limit || 20;

    if (isNaN(beforeTime) || isNaN(limit) || !postId) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    var params = {
        access_token: userProvider.providerTokens.accessToken,
        limit: limit,
        since: beforeTime
    };

    var parameters = urlFormatter.serialize(params);
    Wreck.get(this._apiURL + "/" + postId + '/comments?' + parameters, {  }, function (err, res, payload) {
        if (err) return callback(err);

        // Verify Access Token validity
        self.authStrategy.checkAccessToken(userProvider, payload, function (err) {
            if (err) return callback(err);

            try {
                payload = JSON.parse(payload);
            } catch (e) {
                return callback(e.message);
            }

            var postLink = 'https://facebook.com/' + postId.replace('_', '/posts/');
            return callback(null, payload.data, [], postLink, !!payload.paging);
        });
    });
};

/**
 * Process the comments to a unified format
 */
//{ id: '10152359045841282_34123272',
//  from: { id: '1450628956', name: 'Patrick Scholiers' },
//  message: 'waarom moet altijd een kind ook het slachtoffer zijn ? :\'(',
//  can_remove: false,
//  created_time: '2014-04-09T19:53:02+0000',
//  like_count: 12,
//  user_likes: false }
Strategy.prototype.processComment = function(comment, userProvider) {
    var accessToken = userProvider.providerTokens.accessToken;

    var commentJSON = {
        id: comment['id'],
        user: {
            id: comment['from']['id'],
            name: comment['from']['name'],
            name_formatted: null,
            image: this._apiURL + '/' + comment['from']['id'] + '/picture?access_token=' + accessToken,
            profile_link: 'https://facebook.com/' + comment['from']['id']
        },
        content: {
            date_created: comment['created_time'],
            message: comment['message'],
            can_remove: comment['can_remove'] || false
        }
    };

    return commentJSON;
};

/**
 * Process the post and unify it
 */
Strategy.prototype.processPost = function (post, userProvider) {
    var self = this;
    var accessToken = userProvider.providerTokens.accessToken;
    var fromId = post.from ? post.from.id : "";
    var fromName = post.from ? post.from.name : "";
    var fromLink = post.from ? post.from.link : "";
    if (!post.from) post.from = { id: "" }
    var postLink = (post.actions && post.actions[0].link) ? post.actions && post.actions[0].link : post.id.toString().replace('_', '/posts/').replace(post.from.id, fromLink);
    var userLikesPost = _likesPost(userProvider, post, userProvider.providerAccount.userFullName);

    var json = {};
    json.id = post.id;
    json.post_link = postLink;

    // User
    json.user = {};
    json.user.id = fromId;
    json.user.name = fromName;
    json.user.image = this._apiURL + '/' + fromId + '/picture?access_token=' + accessToken;
    json.user.profile_link = fromLink || 'https://facebook.com/' + fromId;

    // Provider
    json.provider = {};
    json.provider.id = userProvider._id.toString();
    json.provider.name = "facebook";

    // Content
    json.content = {};
    json.content.message = post['message'];
    json.content.date_created = new Date(post['created_time']);

    // Action
    json.content.action = {};
    if (post['story']) json.content.action.message = post['story'];

    // Content Action Counts
    json.content.action_counts = {};
    json.content.action_counts.likes = post['likes'] ? post['likes']['data'].length : 0;
    json.content.action_counts.shares = post['shares'] ? post['shares']['count'] : 0;
    json.content.action_counts.comments = post['comments'] ? post['comments']['data']['total_count'] : 0;

    // Content Actions performed
    json.content.actions_performed = {};
    json.content.actions_performed.shared = (post['user_shared']) ? post['user_shared'] : false;
    json.content.actions_performed.liked = userLikesPost;

    // if any 'message_tags name' contains 'to data name' it is a mention and not a post to other user's wall
    var isPostToUser = true;
    if( post['message_tags'] ) {
        for (var key in post['message_tags']) {
            if(post['message_tags'][key]['name'] == post.to.data.name) {
                isPostToUser = false;
            }
        }
    }

    // To User (add >)
    if (isPostToUser && (!post['story']) && post.to && post.to.data && post.to.data.length == 1) {
        json.content.action.user = {};
        json.content.action.type = 'to_user';
        json.content.action.user.id = post.to.data[0]['id'];
        json.content.action.user.name = post.to.data[0]['name'];
        json.content.action.user.image = this._apiURL + '/' + post.to.data[0]['id'] + '/picture?access_token=' + accessToken;
        json.content.action.user.profile_link = post.to.data[0]['link'];
    }

    // Entities
    json.content.entities = {};
    json.content.entities.pictures = [];
    json.content.entities.videos = [];
    json.content.entities.hashtags = [];
    json.content.entities.mentions = [];
    json.content.entities.links = [];
    json.content.entities.place = {};


    // Extended Link (Type = Link)
    if (post['type'] == "link") {
        json.content.entities.extended_link = {};
        json.content.entities.extended_link.name = post['name'];
        json.content.entities.extended_link.description = post['description'];
        json.content.entities.extended_link.url = post['link'];
        json.content.entities.extended_link.image = post['picture'];
    };

    // Add Pictures
    if (post['picture'] && post['type'] != "link"  && post['type'] != "video") {
        var entity = {};
        var appendSign = (post['picture'].indexOf('?') >= 0) ? '&' : '?';

        entity.small_picture = {};
        entity.small_picture.url = 'https://graph.facebook.com/' + self._apiVersion + "/" + post['object_id'] + "/picture?access_token=" + accessToken;
        entity.small_picture.width = 0;
        entity.small_picture.height = 0;

        entity.large_picture = {};
        entity.large_picture.url = 'https://graph.facebook.com/' + self._apiVersion + "/" + post['object_id'] + "/picture?access_token=" + accessToken;
        entity.large_picture.width = 0;
        entity.large_picture.height = 0;

        entity.caption = post['caption'] || post['description'] || "";

        json.content.entities.pictures.push(entity);
    }

    // Add mentions
    if (post['to']) {
        for (var i in post['to']['data']) {
            var entity = {};
            entity.name = post['to']['data'][i]['name'];
            entity.id = post['to']['data'][i]['id'];
            entity.profile_link = post['to']['data'][i]['link'];

            json.content.entities.mentions.push(entity);
        }
    }

    // Add Links
    if (post['link'] && post['type'] != "link" && post['type'] != "photo" && post['type'] != "video") {
        var entity = {};
        entity.display_url = post['link'];
        entity.expanded_url = post['link'];

        json.content.entities.links.push(entity);
    }

    // Add Videos
    if (post['type'] == "video" && (post['status_type'] == 'added_video' || post['status_type'] == 'shared_story')) {
        var entity = {};
        entity.name = post['name'];
        entity.image = post['picture'];
        entity.url = post['source'];
        entity.description = post['description'];

        json.content.entities.videos.push(entity);
    }

    // Process links with regex
    if (post['message']) {
        var result = regex.getLinks(post['message']);

        if (result) {
            for (var i in result) {
                var entity = {};
                entity.display_url = result[i];
                entity.expanded_url = result[i];
                if (json.content.entities.links.indexOf(entity) == -1 ) {
                    json.content.entities.links.push(entity);
                }
            }
        }
    }

    // Process hashtags with regex
    if (post['message']) {
        var result = regex.getHashtags(post['message']);

        if (result) {
            for (var i in result) {
                var name = result[i].trim().substr(1, result[i].length);

                var entity = {};
                entity.name = name;
                entity.link = 'https://facebook.com/hashtag/' + name;

                json.content.entities.hashtags.push(entity);
            }
        }
    }

    // Add mentions
    if (post['message_tags']) {
        for (var i in post['message_tags']) {
            for (var j in post['message_tags'][i]) {
                var entity = {};
                entity.name = post['message_tags'][i][j]['name'];
                entity.link = 'https://facebook.com/' + post['message_tags'][i][j]['id'];

                json.content.entities.hashtags.push(entity);
            }
        }
    }

    // Add place
    // https://www.facebook.com/pages/Design-museum-Gent-de-offici%C3%ABle-versie/105111576245522
    if (post['place']) {
        json.content.entities.place.url = this._pagesURL + '/' + post['place']['name'] + '/' + post['place']['id'];
        json.content.entities.place.name = post['place']['name'];
    }

    // Pagination
    json.pagination = {};
    json.pagination.since = (Math.round(new Date(json.content.date_created.toString()).getTime() / 1000)).toString(); // Get unix time

    return json;
};

/**
 * Check if a post is supported
 */
var _isPostSupported = function(post) {
    var excluded = ["created_note", "created_group", "created_event", "app_created_story", "approved_friend"];

    if (excluded.indexOf(post['type']) > -1) {
        return false;
    }

    if (post['story'] && /(commented)|(like)|(going)|(event)/.test(post['story'])) {
        return false;
    }

    // If we got a link as type without actual links in it (mostly because of a fb app)
    if (post['type'] == 'link' && post['link'] == undefined) {
        return false;
    }

    // If we got a status without a message
    if (post['type'] == 'status' && post['message'] == undefined) {
        return false;
    }

    return true;
};

/**
 * Check if the user likes the given posts
 * @param {object} userProvider
 * @param {object} post         the unformatted post!
 * @param {String} userId
 */
var _likesPost = function(userProvider, post, username) {
    if (!post.likes || !post.likes.data){
        return false;
    }

    for (var i in post.likes.data) {
        if (post.likes.data[i].name == username) {
            return true;
        }
    }

    return false;
};

/**
 * Get the posts
 * @param String accessToken
 * @param Int limit
 * @param Object options
 * @param Function callback (error, results)
 */
var _getPosts = function(authStrategy, userProvider, apiURL, fieldsFeed, limit, options, callback) {
    var self = this;
    var params = {
        access_token: userProvider.providerTokens.accessToken,
        fields: fieldsFeed
    };

    params.limit = limit || 30;
    if (options.since) params.since = options.since.toString();
    if (options.until) params.until = options.until.toString();

    var parameters = urlFormatter.serialize(params);
    Wreck.get(apiURL + '/me/home?' + parameters, { timeout: 1000 * 30 }, function (err, res, payload) {
        if (err) return callback(err);

        return authStrategy.checkAccessToken(userProvider, payload, function(err) {
            if (err) return callback(err);

            try {
                payload = JSON.parse(payload);
            } catch (e) {
                return callback(payload);
            }

            if (payload.type && payload.type.indexOf("Exception") >= 0) {
                return callback(payload);
            }

            return callback(null, payload.data);
        });
    });
};

module.exports = Strategy;
