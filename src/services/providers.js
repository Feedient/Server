var UserProvider    = require('../entities/userProvider');
var provider        = require('./provider');
var msgFormatter    = require('../lib/msgFormatter');
var async 		  	= require('async');
var fs			  	= require('fs');
// Important! : We can not init this in constructor since else it will get cached for bulk requests!
var ProviderAPI     = require('../strategies/providers');

var Providers = function() {
};

/**
 * The structure of the JSON being received looks like this:
 * [
 *     {
 *         providerId: "IDHERE",
 *         until: "ID/DATE/...HERE"
 *     },
 *     {
 *         providerId: "IDHERE",
 *         until: "ID/DATE/...HERE"
 *     }
 * ]
 */
exports.getOlderPosts = function(userEntity, objects, callback) {
    var self = this;
    var providerFeeds = [];

    var amountOfPosts = 30; // Get 30 posts for each provider
    async.forEach(objects, function(object, asyncCallback) {
        userEntity.hasUserProvider(object.providerId, function(err, userProvider) {
            if (err) return asyncCallback(err);

            // If we do not have the userProvider return error
            if (!userProvider) return asyncCallback('PROVIDER_NOT_FOUND');

            var providerName = userProvider.providerName;

            // Check if we got the given provider
            ProviderAPI.getFeedAPI(providerName).getFeed(userProvider, null, object.until, amountOfPosts, function (err, posts) {
                if (err) return asyncCallback(err);
                if (!posts.length) return asyncCallback(null); // Just return if we got no new posts

                var postSchema = {
                    providerId: userProvider._id,
                    posts: posts
                };

                providerFeeds.push(postSchema);

                return asyncCallback(null);
            });
        });
    }, function(err) {
        if (err) return callback(err);

        createFeedSchema(providerFeeds, false, function(result) {
            return callback(result);
        });
    });
};

/**
 * This gets newer posts for the providers specified
 *
 * The structure of the JSON being received looks like this:
 * [
 *     {
 *         providerId: "IDHERE",
 *         since: "ID/DATE/...HERE"
 *     },
 *     {
 *         providerId: "IDHERE",
 *         since: "ID/DATE/...HERE"
 *     }
 * ]
 *
 * This structure has been created so we can have a variable since, this
 * because facebook uses date, twitter uses a postId, ...
 *
 * @param {Object} request
 * @param {Object} reply
 */
exports.getNewerPosts = function(userEntity, objects, callback) {
    var providerFeeds = [];
    var self = this;
    var amountOfPosts = 30; // Get 30 posts for each provider

    async.each(objects, function(object, asyncCallback) {
        userEntity.hasUserProvider(object.providerId, function(err, userProvider) {
            if (err) return asyncCallback(err);

            // If we do not have the userProvider return error
            if (!userProvider) return asyncCallback('PROVIDER_NOT_FOUND');

            var providerName = userProvider.providerName;

            // Check if we got the given provider
            ProviderAPI.getFeedAPI(providerName).getFeed(userProvider, object.since, null, amountOfPosts, function (err, posts) {
                if (err) return asyncCallback(err);
                if (!posts.length) return asyncCallback(null); // Just return if we got no new posts

                var postSchema = {
                    providerId: userProvider._id,
                    posts: posts
                };

                providerFeeds.push(postSchema);

                return asyncCallback(null);
            });
        });
    }, function(err) {
        if (err) return callback(err);
        createFeedSchema(providerFeeds, false, function(result) {
            return callback(result);
        });
    });
};

/**
 * JSON Structure
 * [
 *     "providerid1",
 *     "providerid2"
 * ]
 *
 * @param {Object} request
 * @param {Object} reply
 */
exports.getFeeds = function(userEntity, providers, amountOfPosts, callback) {
    var amountOfPosts = amountOfPosts || 30;
    var self = this;
    var providerFeeds = [];

    async.forEach(providers, function(provider, asyncCallback) {
        userEntity.hasUserProvider(provider, function(err, userProvider) {
            if (err) return asyncCallback(err);

            // If we do not have the userProvider return error
            if (!userProvider) return asyncCallback('PROVIDER_NOT_FOUND');

            var providerName = userProvider.providerName;

            // Check if we got the given provider
            ProviderAPI.getFeedAPI(providerName).getFeed(userProvider, 0, null, amountOfPosts, function (err, posts) {
                if (err) return asyncCallback(err);
                if (!posts.length) return asyncCallback(null); // Just return if we got no posts

                var postSchema = {
                    providerId: userProvider._id,
                    posts: posts
                };

                providerFeeds.push(postSchema);
                return asyncCallback();
            });
        });
    }, function(err) {
        if (err) return callback(err);
        createFeedSchema(providerFeeds, true, function(result) {
            return callback(result);
        });
    });
};

exports.updateOrder = function (userEntity, providerOrders, callback) {
    var providerOrders;

    // Try parsing the providers
    try {
        providerOrders = JSON.parse(providerOrders);
    } catch (e) {
        return callback('errors.UNKNOWN_ERROR');
    }

    // Check if the user got all the providers
    async.forEach(providerOrders, function(provider, asyncCallback) {
        userEntity.hasUserProvider(provider.providerId, function(err, userProvider) {
            if (err) return asyncCallback(err);
            return asyncCallback();
        });
    }, function(err) {
        if (err) return callback('errors.UNKNOWN_ERROR');

        // Update the providers
        async.forEach(providerOrders, function(provider, asyncCallback) {
            UserProvider.updateOrder(provider.providerId, provider.order, function(err) {
                if (err) return asyncCallback(err);
                return asyncCallback();
            });
        }, function(err) {
            if (err) return callback('errors.UNKNOWN_ERROR');
            return callback(null, { success: true });
        });
    });
};

exports.compose = function (userEntity, providers, payloadData, callback) {
    var self = this;

    // Try, since we are parsing JSON
    try {
        providers = JSON.parse(providers);
    } catch (e) {
        console.log("Catched json parse");
        return callback(e.message);
    }

    var results = [];

    // For every provider call the post
    async.forEach(providers, function(provider, asyncCallback) {
        // check if we have the provider
        userEntity.hasUserProvider(provider, function(err, userProvider) {
            if (err) return asyncCallback(err);

            // If we do not have the userProvider return error
            if (!userProvider) return asyncCallback('PROVIDER_NOT_FOUND');

            var providerName = userProvider.providerName;

            // Check if we got the given provider
            ProviderAPI.getActionAPI(providerName).doAction(userProvider, 'compose', payloadData, function(err, result) {
                if (err) return asyncCallback(err);
                results.push({ post_id: result, provider: userProvider._id });
                return asyncCallback();
            });
        });
    }, function(err) {
        if (err) return callback(err);
        return callback(null, results);
    });
};

exports.composeWithPicture = function(userEntity, providers, picture, payloadData, callback) {
    var self = this;

    // Try, since we are parsing JSON
    try {
        providers = JSON.parse(providers);
    } catch (e) {
        return callback(e.message);
    }

    var results = [];
    var errors = [];

    // Rename our uploaded file to it's original name
    fs.rename(picture.path, "/tmp/" + picture.filename, function(err) {
        if (err) return callback('errors.IMAGE_UPLOAD_RENAME');

        // For every provider call the post
        async.forEach(providers, function(provider, asyncCallback) {
            // check if we have the provider
            userEntity.hasUserProvider(provider, function(err, userProvider) {
                if (err) return asyncCallback(err);

                // If we do not have the userProvider return error
                if (!userProvider) return asyncCallback('PROVIDER_NOT_FOUND');

                var providerName = userProvider.providerName;

                // Check if we got the given provider
                ProviderAPI.getActionAPI(providerName).doAction(userProvider, 'composeWithPicture', payloadData, function(err, result) {
                    if (err) return asyncCallback({ provider: userProvider.providerName, error: err });
                    results.push({ post_id: result, provider: userProvider._id });
                    return asyncCallback();
                });
            });
        // Done going through all the elements
        }, function(err) {
            // Remove the picture
            fs.unlink("/tmp/" + picture.filename, function(err2) {
                if (err) return callback(err);
                if (err2) return callback(err);
                return callback(results);
            });
        });
    });
};


/**
 * Transforms the providers and the found posts / provider to the feed result
 * The posts parameter object has to look like:
 * [
 *     {
 *         providerId: "SOMEID",
 *         posts: []
 *     }
 * ]
 *
 * The returned schema looks like:
 * {
 *     posts: []
 *     pagination: []
 * }
 *
 * @params cutOff boolean do we cut off the amount of posts to the one with the least results?
 */
var createFeedSchema = function(providerFeeds, cutOff, mainCallback) {
    var feedSchema = {
        posts: [],
        pagination: []
    };

    var providerSinceKeys = {};
    var providerFeedLengths = [];
    var amountsOfPostsAdded = {};

    // Go through the providerPosts and perform following actions:
    // - Collect the sinceKeys
    // - Add the posts to the feedSchema
    // - Add the length of the posts to an array
    async.forEach(providerFeeds, function(providerFeed, callback) {
        var since = providerFeed.posts[0].pagination.since;
        providerSinceKeys[providerFeed.providerId] = since;
        providerFeedLengths.push(providerFeed.posts.length);
        feedSchema.posts = feedSchema.posts.concat(providerFeed.posts);
        amountsOfPostsAdded[providerFeed.providerId] = 0; // Init postsAdded on 0
        return callback();
    }, function(err) {
        // Sort all the posts on date (newest to latest)
        feedSchema.posts.sort(function(a, b) {
            return new Date(b.content.date_created) - new Date(a.content.date_created);
        });

        // Cut the array to the lowest amount of posts returned
        providerFeedLengths.sort(function(a, b) { return a - b }); // Sort ascending

        if (cutOff) {
            feedSchema.posts = feedSchema.posts.splice(0, providerFeedLengths[0]);
        }

        // Calculate the amount of posts that got added to the result of the provider
        async.forEach(feedSchema.posts, function(postAdded, callback) {
            amountsOfPostsAdded[postAdded.provider.id]++;
            return callback();
        }, function(err) {
            // Add the until pagination, this is the amountOfPostsOfProviderAdded
            // index (basically the last post of the provider in the feed)
            async.forEach(providerFeeds, function(providerFeed, callback) {
                var postsAdded = amountsOfPostsAdded[providerFeed.providerId] || 0;

                // Get the post of provider x at index amounts[provider]
                var post = (postsAdded > 0) ? providerFeed.posts[postsAdded - 1] : providerFeed.posts[postsAdded];

                if (post) {
                    feedSchema.pagination.push({ providerId: providerFeed.providerId, since: providerSinceKeys[providerFeed.providerId], until: post.pagination.since});
                }
                return callback();
            }, function(err) {
                return mainCallback(feedSchema);
            });
        });
    });
};
