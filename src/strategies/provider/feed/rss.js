var util            = require('util');
var BaseStrategy    = require('./baseStrategy');
var Wreck 			= require('wreck');
var urlFormatter 	= require('../../../lib/urlFormatter');
var async 			= require('async');
var config          = require('../../../../config/app');
var xml2js          = require('xml2js');

function Strategy(authStrategy, options) {
    if (!authStrategy) { throw new TypeError('FeedAPI requires an authentication strategy.') }

    options = options || {};

    BaseStrategy.call(this);

    this.name = 'rss';

    this.authStrategy = authStrategy;
};

/**
* Inherit from `BaseStrategy`
*/
util.inherits(Strategy, BaseStrategy);

Strategy.prototype.getFeed = function(userProvider, timeSince, timeUntil, limit, callback) {
    var self = this;

    Wreck.get(userProvider.providerAccount.url, {  }, function (err, res, payload) {
        if (err) return callback(err);

        var parser = new xml2js.Parser();
        parser.parseString(payload, function(err, result) {
            if (err) return callback("Unable to fetch RSS (Unavailable or Wrong Format)");

            if (result.rss && result.rss.channel) {
                return callback(null, result.rss.channel[0].item);
            } else if (result.feed) {
                return callback(null, result.feed.entry);
            }

            return callback("Unable to determine the RSS post format.");
        });
    });
};

Strategy.prototype.getPost = function(userProvider, postId, callback) {
    var self = this;
    return callback(null, {});
};

/**
* Process the post to the unified format
*/
Strategy.prototype.processPost = function (post, userProvider) {
    var parsedPost = {};
    parsedPost.content = {};
    parsedPost.content.date_created = new Date();

    // Check if RSS2 or ATOM (RSS2 if pubDate, ATOM if published)
    try {
        if (post.pubDate) {
            parsedPost = _parseRss2Post(post, userProvider);
        } else if (post.published) {
            parsedPost = _parseAtomPost(post, userProvider);
        } else {
            parsedPost = parsedPost; // Invalid
        }
    } catch (e) {
        return parsedPost;
    }

    return parsedPost;
};

var _parseAtomPost = function(post, userProvider) {
    var json = {};
    json.id = post.link[0]['$']['href'];
    json.post_link = post.link[0]['$']['href'];

    // User (Todo, figure way to get meta)
    json.user = {};
    json.user.id = null;
    json.user.name = userProvider.providerAccount.username;
    //json.user.image = userProvider.providerAccount.avatar;
    json.user.profile_link = userProvider.providerAccount.url;

    // Provider
    json.provider = {};
    json.provider.id = userProvider._id.toString();
    json.provider.name = "rss";

    // Content
    json.content = {};
    json.content.title = post.title[0];
    json.content.message = post.content[0]['_'];
    json.content.date_created = new Date(post.published[0]) || new Date();

    // Action Counts
    json.content.action_counts = {};

    // Actions Performed
    json.content.actions_performed = {};

    // Entities
    json.content.entities = {};
    json.content.entities.pictures = [];
    json.content.entities.videos = [];
    json.content.entities.hashtags = [];
    json.content.entities.mentions = [];
    json.content.entities.links = [];

    var entity = {};
    entity.display_url = post.title[0];
    entity.expanded_url = post.link[0]['$']['href'];

    json.content.entities.links.push(entity);

    // Pagination
    json.pagination = {};
    json.pagination.since = json.content.date_created.toString();

    return json;
};

var _parseRss2Post = function(post, userProvider) {
    var json = {};
    json.id = post.link[0];
    json.post_link = post.link[0];

    // User (Todo, figure way to get meta)
    json.user = {};
    json.user.id = null;
    json.user.name = userProvider.providerAccount.username;
    //json.user.image = userProvider.providerAccount.avatar;
    json.user.profile_link = userProvider.providerAccount.url;

    // Provider
    json.provider = {};
    json.provider.id = userProvider._id.toString();
    json.provider.name = "rss";

    // Content
    json.content = {};
    json.content.title = post.title[0];
    json.content.message = post.description[0];
    json.content.date_created = new Date(post.pubDate[0]) || new Date();

    // Action Counts
    json.content.action_counts = {};

    // Actions Performed
    json.content.actions_performed = {};

    // Entities
    json.content.entities = {};
    json.content.entities.pictures = [];
    json.content.entities.videos = [];
    json.content.entities.hashtags = [];
    json.content.entities.mentions = [];
    json.content.entities.links = [];

    var entity = {};
    entity.display_url = post.title[0];
    entity.expanded_url = post.link[0];

    json.content.entities.links.push(entity);

    // Pagination
    json.pagination = {};
    json.pagination.since = json.content.date_created.toString();

    return json;
};

module.exports = Strategy;
