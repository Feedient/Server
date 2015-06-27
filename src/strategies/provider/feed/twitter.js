var util            = require('util');
var BaseStrategy    = require('./baseStrategy');
var async           = require('async');
var msgFormatter 	= require('../../../lib/msgFormatter');
var urlFormatter 	= require('../../../lib/urlFormatter');
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

    this.name = 'twitter';
    this._feedUrl = options.apiURL + '/me';

    this._apiURL = options.apiURL;
    this.authStrategy = authStrategy;
};

/**
 * Inherit from `BaseStrategy`
 */
util.inherits(Strategy, BaseStrategy);

/**
 * Gets the user his/her feed
 */
Strategy.prototype.getFeed = function(userProvider, sinceId, until, limit, callback) {
    var params = {
        count: limit,
        include_rts: true
    };

    if (until) params.max_id = until;
    if (sinceId) params.since_id = sinceId;

    var self = this;

    var parameters = urlFormatter.serialize(params);
    self.authStrategy.getOAuth().get('https://api.twitter.com/1.1/statuses/home_timeline.json?' + parameters, userProvider.providerTokens.accessToken, userProvider.providerTokens.accessTokenSecret, function(err, results) {
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

/**
 * Gets a tweet
 *
 * @api-method GET
 * @api-url    /provider/:userProviderId/:postId
 *
 * @param  {UserProvider}   userProvider
 * @param  {int}            postId
 * @param  {array}   		body 			[Needs: body.userId]
 * @param  {Function} 		callback
 * @return {array}
 */
Strategy.prototype.getPost = function(userProvider, postId, callback) {
    var self = this;

    self.authStrategy.getOAuth().get('https://api.twitter.com/1.1/statuses/show.json?id=' + postId + '&include_my_retweet=true', userProvider.providerTokens.accessToken, userProvider.providerTokens.accessTokenSecret, function(err, result) {
        self.authStrategy.checkAccessToken(userProvider, result, function(err) {
            if (err) return callback(err);
            try {
                result = JSON.parse(result);
            } catch (e) {
                return callback(e.message);
            }

            return callback(null, result);
        });
    });
};

/**
 * Process a post and form it to the unified feed
 */
Strategy.prototype.processPost = function (post, userProvider) {
    if (!post['user']) {
        return null;
    }

    var screenName = post['user']['screen_name'] || "undefined";
    var postLink = 'https://twitter.com/' + screenName + '/status/' + post['id_str'];
    var dateCreated = new Date(Date.parse(post['created_at']));

    var json = {};
    json.id = post['id_str'];
    json.post_link = postLink;

    // User
    json.user = {};
    json.user.id = post['user']['id_str'];
    json.user.name = post['user']['name'];
    json.user.name_formatted = '@' + post['user']['screen_name'];
    json.user.image = post['user']['profile_image_url_https'];
    json.user.profile_link = 'https://twitter.com/' + screenName;

    // Provider
    json.provider = {};
    json.provider.id = userProvider._id.toString();
    json.provider.name = "twitter";

    // Content
    json.content = {};
    json.content.message = post['text'] || "";
    json.content.date_created = dateCreated;

    // Action Counts
    json.content.action_counts = {};
    json.content.action_counts.retweets = post['retweet_count'] || 0;
    json.content.action_counts.favorites = post['favorite_count'] || 0;

    // Actions Performed
    json.content.actions_performed = {};
    json.content.actions_performed.retweeted = post['retweeted'] || false;
    json.content.actions_performed.favorited = post['favorited'] || false;
    json.content.is_conversation = (post['in_reply_to_status_id'] ? true : false);

    // Twitter
    json.twitter = {};
    json.twitter.in_reply_to_status_id_str =  post['in_reply_to_status_id_str'] || null;

    // Entities
    if (post['entities']) {
        json.content.entities = {};
        json.content.entities.pictures = [];
        json.content.entities.videos = [];
        json.content.entities.hashtags = [];
        json.content.entities.mentions = [];
        json.content.entities.links = [];

        if (post['entities']['urls']) {
            for (var j in post['entities']['urls']) {
                var entity = {};
                entity.shortened_url = post['entities']['urls'][j]['url'];
                entity.display_url  = post['entities']['urls'][j]['display_url'];
                entity.extended_url = post['entities']['urls'][j]['expanded_url'];

                json.content.entities.links.push(entity);
            }
        }

        if (post['entities']['media']) {
            for (var j in post['entities']['media']) {
                var pictureEntity = {};

                pictureEntity.small_picture = {};
                pictureEntity.small_picture.url = post['entities']['media'][j]['media_url_https'];
                pictureEntity.small_picture.width = post['entities']['media'][j]['sizes']['small']['w'];
                pictureEntity.small_picture.height = post['entities']['media'][j]['sizes']['small']['h'];

                pictureEntity.large_picture = {};
                pictureEntity.large_picture.url = post['entities']['media'][j]['media_url_https'];
                pictureEntity.large_picture.width = post['entities']['media'][j]['sizes']['large']['w'];
                pictureEntity.large_picture.height = post['entities']['media'][j]['sizes']['large']['h'];

                pictureEntity.caption = "";

                json.content.entities.pictures.push(pictureEntity);

                var linkEntity = {};
                linkEntity.shortened_url = post['entities']['media'][j]['url'];
                linkEntity.display_url  = post['entities']['media'][j]['display_url'];
                linkEntity.extended_url = post['entities']['media'][j]['expanded_url'];

                json.content.entities.links.push(linkEntity);
            }
        }

        if (post['entities']['hashtags']) {
            for (var j in post['entities']['hashtags']) {
                var entity = {};
                entity.name = post['entities']['hashtags'][j]['text'];
                entity.link = 'https://twitter.com/hashtag/' + post['entities']['hashtags'][j]['text'];

                json.content.entities.hashtags.push(entity);
            }
        }

        if (post['entities']['user_mentions']) {
            for (var j in post['entities']['user_mentions']) {
                var entity = {};
                entity.name = '@' + post['entities']['user_mentions'][j]['screen_name'];
                entity.profile_link = 'https://twitter.com/' + post['entities']['user_mentions'][j]['screen_name'];

                json.content.entities.mentions.push(entity);
            }
        }
    }

    // Process Retweet
    if (post['retweeted_status'] !== undefined) {
        json.post_link = 'https://twitter.com/' + post['retweeted_status']['user']['screen_name'] + '/status/' + post['retweeted_status']['id_str'];
        json.user.profile_link = 'https://twitter.com/' + post['retweeted_status']['user']['screen_name'];
        json.user.id = post['retweeted_status']['user']['id_str'];
        json.user.name = post['retweeted_status']['user']['name'];
        json.user.name_formatted = '@' + post['retweeted_status']['user']['screen_name'];
        json.user.image = post['retweeted_status']['user']['profile_image_url_https'];
        json.content.message = post['retweeted_status']['text'];
        //json.content.date_created = post['retweeted_status']['created_at'];
        json.original_id = post['retweeted_status']['id_str'];

        // Action
        json.content.action = {};
        json.content.action.type = 'retweet';

        // Action User
        json.content.action.user = {};
        json.content.action.user.id = post['user']['id_str'];
        json.content.action.user.name = post['user']['name'];
        json.content.action.user.name_formatted = '@'+ post['user']['screen_name'];
        json.content.action.user.image = post['user']['profile_image_url_https'];
        json.content.action.user.profile_link = 'https://twitter.com/' + post['user']['screen_name'];
    }

    // Pagination
    json.pagination = {};
    json.pagination.since = json.id.toString();

    return json;
};

/**
 * Gets the comments for a post
 *
 * Twitter is retarded and does not provide a comments api endpoint, therefor we create it
 *
 * @api-method POST
 * @api-url    /provider/:userProviderId/:postId/comments
 * @api-body   userId    This is the twitter handler, example thebillkidy for @thebillkidy, this is the user which you want to get comments for!
 *
 * @param  {UserProvider}   userProvider
 * @param  {int}            postId
 * @param  {array}   		body 			[Needs: body.userId]
 * @param  {Function} 		callback
 * @return {array}
 */
Strategy.prototype.getPostComments = function(userProvider, postId, beforeTime, limit, userId, callback) {
       if (!userId) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    var userId = "%40" + userId;

    var self = this;

    // Get All the tweets posted since that post id (100 tweets)
    self.authStrategy.getOAuth().get('https://api.twitter.com/1.1/search/tweets.json?q=' + userId + '&since_id=' + postId + '&include_entities=true&result_type=mixed&count=100', userProvider.providerTokens.accessToken, userProvider.providerTokens.accessTokenSecret, function(err, results) {
        self.authStrategy.checkAccessToken(userProvider, results, function(err) {
            if (err) return callback(err);

            try {
                results = JSON.parse(results);
            } catch (e) {
                return callback(e.message);
            }

            var comments = [];
            var parentComments = [];
            var currentPost = null;
            var recursiveLimit = 3; // Max 3 times recursive
            var currentRecursiveCount = 0;

            // Add comments
            for (var result in results['statuses']) {
                if (results['statuses'][result]['in_reply_to_status_id_str'] == postId.toString()) {
                    comments.push(results['statuses'][result]);
                }
            }

            // Get the current post
            self.getPost(userProvider, postId, function (err, result) {
                if (err) return callback(err);

                currentPost = result;

                // If we got a reply to a status, get the status
                // Do a recursive operation to the getPost function for the in_reply_to_status_id
                if (currentPost && currentPost['in_reply_to_status_id_str']) {
                    // The recursive loop
                    var getParentPost = function(replyPostId) {
                        self.getPost(userProvider, replyPostId, function(err, result) {
                            if (err) return callback(err);

                            // Add the found parent
                            parentComments.push(self.processComment(result, userProvider));

                            currentRecursiveCount++;

                            // Call it again if we got a reply
                            if (currentRecursiveCount < recursiveLimit && result['in_reply_to_status_id_str']) {
                                getParentPost(result['in_reply_to_status_id_str']);
                            } else {
                                // Standard return the comments
                                var postLink = "";
                                var hasMoreComments = (currentRecursiveCount >= recursiveLimit);

                                // Sort parents in descending order
                                parentComments.sort(function(a, b) {
                                    return a.content.date_created - b.content.date_created;
                                });

                                return callback(null, comments, parentComments, postLink, hasMoreComments);
                            }
                        });
                    }

                    // Start calling the recursive loop
                    getParentPost(currentPost['in_reply_to_status_id_str']);
                } else {
                    // Standard return the comments
                    var postLink = "";
                    var hasMoreComments = (currentRecursiveCount >= recursiveLimit);
                    return callback(null, comments, parentComments, postLink, hasMoreComments);
                }
            });
        });
    });
};

Strategy.prototype.processComment = function(comment, userProvider) {
    return this.processPost(comment, userProvider);
    // var commentJSON = {
    //     id: comment['id_str'],
    //     user: {
    //         id: comment['user']['id_str'],
    //         name: comment['user']['name'],
    //         name_formatted: '@'+ comment['user']['screen_name'],
    //         image: comment['user']['profile_image_url_https'],
    //         profile_link: 'https://twitter.com/' + comment['user']['screen_name']
    //     },
    //     content: {
    //         date_created: comment['created_at'],
    //         message: comment['text'],
    //         can_remove: false
    //     }
    // };
    //
    // return commentJSON;
};

module.exports = function(authStrategy, options) {
    return new Strategy(authStrategy, options);
};
