'use strict';

var util            = require('util');
var BaseStrategy    = require('./baseStrategy');
var OAuth           = require('oauth').OAuth;
var async           = require('async');
var tumblr          = require('tumblr.js');
var msgFormatter    = require('../../../lib/msgFormatter');
var urlFormatter    = require('../../../lib/urlFormatter');
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

    this.name = 'tumblr';
    this._feedUrl = options.apiURL + '/me';

    this.authStrategy = authStrategy;
};

/**
 * Inherit from `BaseStrategy`
 */
util.inherits(Strategy, BaseStrategy);

/**
 * Gets the user his/her feed
 * Note: timeSince and timeUntil are:
 *     - timeSince: MIN_ID: Return media later than this min_id.
 *     - timeUntil: MAX_ID: Return media earlier than this max_id.s
 *
 * @param userProvider
 * @param since
 * @param until
 * @param limit
 * @param filterIdsArray array of id's to filter away, this removes duplicates
 * @param callback
 */
Strategy.prototype.getFeed = function(userProvider, since, until, limit, callback) {
    var self = this;

    var params = {
        limit: limit,
        reblog_info: true
    };

    if (until) params.offset = until;

    var parameters = urlFormatter.serialize(params);
    self.authStrategy.getOAuth().get('http://api.tumblr.com/v2/user/dashboard?' + parameters, userProvider.providerTokens.accessToken, userProvider.providerTokens.accessTokenSecret, function(err, result) {
        self.authStrategy.checkAccessToken(userProvider, result, function(err) {
            if (err) return callback(err);

            try {
                result = JSON.parse(result);
            } catch (e) {
                return callback(e.message);
            }

            return callback(null, result.response.posts);
        });
    });
};

Strategy.prototype.getPost = function(userProvider, postId, callback) {
    var client = tumblr.createClient({
        consumer_key: config.providers.tumblr.CONSUMER_KEY,
        consumer_secret: config.providers.tumblr.CONSUMER_SECRET,
        token: userProvider.providerTokens.accessToken,
        token_secret: userProvider.providerTokens.accessTokenSecret
    });

    client.posts(userProvider.providerUserId, { id: postId }, function (err, resp) {
        if (err) return callback(err);
        return callback(null, resp.posts[0]);
    });
};

/**
 * Process a post and form it to the unified feed
 */
Strategy.prototype.processPost = function(post, userProvider) {
    var json = {};
    json.id = "" + post['id'];
    json.post_link = post['short_url'];

    //user
    json.user = {};
    json.user.id = post['blog_name'];
    json.user.name = post['blog_name'];
    json.user.profile_link = 'http://' + post['blog_name'] + '.tumblr.com';
    json.user.image = 'https://api.tumblr.com/v2/blog/' + post['blog_name'] + '.tumblr.com/avatar';

    // Provider
    json.provider = {};
    json.provider.id = userProvider._id.toString();
    json.provider.name = "tumblr";

    // Content
    json.content = {};
    json.content.message = post['body'] || post['text'] || "";
    json.content.date_created = new Date(post['date']);

    // action counts
    json.content.action_counts = {};
    json.content.action_counts.notes = post['note_count'] || 0;

    // actions performed
    json.content.actions_performed = {};
    json.content.actions_performed.liked = post['liked'] || false;

    // tumblr stuff
    json.tumblr = {};
    json.tumblr.reblog_key = post['reblog_key'];
    json.tumblr.post_type = post['type'];

    // Entities
    json.content.entities = {};
    json.content.entities.pictures = [];
    json.content.entities.videos = [];
    json.content.entities.hashtags = [];
    json.content.entities.mentions = [];
    json.content.entities.links = [];
    json.content.entities.extended_link = {};

    json.content.entities.extended_link.name = post['reblogged_from_root_name'];
    json.content.entities.extended_link.url = post['reblogged_from_root_url'];

    // hashtags
    for (var i in post['tags']) {
        var entity = {};
        entity.name = post['tags'][i];
        entity.link = json.user.profile_link + '/tagged/' + post['tags'][i];
        json.content.entities.hashtags.push(entity);
    }

    // process UNSUPPORTED posts (Audio and Video)
    if (post['type'] == 'audio' || post['type'] == 'video' ) {
        return null;
    }

    // process photo post
    if (post['type'] == 'photo') {
        for (var i in post['photos']) {
            var entity = {};
            var smallPictureIndex = post['photos'][i]['alt_sizes'].length - 3; // The 250px width picture


            entity.small_picture = {};
            if (post['photos'][i]['alt_sizes'][smallPictureIndex]) {
                entity.small_picture.url = post['photos'][i]['alt_sizes'][smallPictureIndex]['url'].replace('http://', 'https://').replace('37.media.tumblr.com', '24.media.tumblr.com');
                entity.small_picture.width = post['photos'][i]['alt_sizes'][smallPictureIndex]['width'];
                entity.small_picture.height = post['photos'][i]['alt_sizes'][smallPictureIndex]['height'];
            }

            entity.large_picture = {};
            if (post['photos'][i]['original_size']) {
                entity.large_picture.url = post['photos'][i]['original_size']['url'].replace('http://', 'https://');
                entity.large_picture.width = post['photos'][i]['original_size']['width'];
                entity.large_picture.height = post['photos'][i]['original_size']['height'];
            }

            entity.caption = post['caption'] || post['photos'][i]['caption'];
            entity.caption = entity.caption.replace(/(<([^>]+)>)/ig, "");

            json.content.entities.pictures.push(entity);
        }
    }

    // proccess quote post
    if (post['type'] == 'quote') {
        json.content.entities.extended_link.name = post['source_title'];
        json.content.entities.extended_link.url = post['source_url'];
    }

    // proccess link post
    if (post['type'] == 'link') {
        json.content.entities.extended_link.name = post['title'];
        json.content.entities.extended_link.url = post['url'];
        json.content.entities.extended_link.image = post['link_image'];
        json.content.message = post['description'];
    }

    // temp proccess answer post
    if(post['type'] == 'answer') {
        json.content.message = post['question'] + ' \n\n ' + post['answer'];
    }

    // proccess reblog
    if(post['reblogged_from_id']) {
        // set action and user(reblogging user)
        json.content.action = {};
        json.content.action.type = 'reblogged';
        json.content.action.user = {};
        json.content.action.user.id = post['blog_name'];
        json.content.action.user.name = post['blog_name'];
        json.content.action.user.profile_link = 'http://' + post['blog_name'] + '.tumblr.com';
        json.content.action.user.image = 'https://api.tumblr.com/v2/blog/' + post['blog_name'] + '.tumblr.com/avatar';

        // set post to original poster
        json.id = post['reblogged_from_id'];
        json.post_link = post['reblogged_from_url'];

        json.user.id = post['reblogged_from_name'];
        json.user.name = post['reblogged_from_name'];
        json.user.profile_link = 'http://' + post['reblogged_from_name'] + '.tumblr.com';
        json.user.image = 'https://api.tumblr.com/v2/blog/' + post['reblogged_from_name'] + '.tumblr.com/avatar';
    }

    if (json.content.message) {
        // remove html from message s
        json.content.message = json.content.message.toString().replace(/(<([^>]+)>)/ig, "");
        // remove original poster from message(+the new lines), we show this decently
        json.content.message = json.content.message.toString().replace(/^.+\:\n\n/g, "");
    }

    // Pagination
    json.pagination = {};
    json.pagination.since = (Math.round(new Date(json.content.date_created.toString()).getTime() / 1000)).toString(); // Get unix time

    return json;
};

module.exports = Strategy;
