var async 		    = require('async');
var fs              = require('fs');
var UserProvider    = require('../entities/userProvider');
var Notification    = require('../entities/notification');
var msgFormatter    = require('../lib/msgFormatter');
var config          = require('../../config/app');
var ObjectId        = require('mongoose').Types.ObjectId
var ProvidersAPI    = require('../strategies/providers');

/**
 * Reloads the userProvider data by recalling getProfile and onProcessProfiles
 * @param {[type]}   providerId
 * @param {Function} callback(err, true)
 */
exports.refreshProvider = function(providerId, callback) {
    var self = this;

    UserProvider.getUserProviderById(providerId, function(err, provider) {
        if (err) return callback(err);

        var tokens = {
            access_token: "",
            access_token_secret: ""
        };

        if (provider.providerTokens) {
            tokens.access_token = provider.providerTokens.accessToken || "",
            tokens.access_token_secret = provider.providerTokens.accessTokenSecret || ""
        }

        ProvidersAPI.getAuthAPI(provider.providerName).getProfile(tokens, function(err, result) {
            if (err) return callback(err);

            ProvidersAPI.getAuthAPI(provider.providerName).onProcessProfiles(tokens, result, function(err, providerAccounts) {
                if (err) return callback(err);

                // Save the new account details such as avatar!
                async.each(providerAccounts, function(providerAccount, callback) {
                    provider.updateProviderAccount(providerAccount.account, function(err) {
                        if (err) return callback(err);
                        return callback(null);
                    });
                }, function(err) {
                    if (err) return callback(err);
                    return callback(null, true);
                });
            });
        });
    });
};

exports.getProvider = function(providerId, callback) {
    UserProvider.getUserProviderById(providerId, function(err, provider) {
        if (err) return callback(err);

        var json = ProvidersAPI.getAuthAPI(provider.providerName).formatProvider(provider);
        return callback(null, json);
    });
};

/**
 * Gets the providers for your account
 *
 * callback(null, results)
 */
exports.getProviders = function(userEntity, callback) {
    userEntity.getUserProviders(function(err, providers) {
        if (err) return callback(err);

        var result = [];

        // If no providers, return empty
        if (!providers || providers.length == 0) {
            return callback(null, []);
        }

        // Format the providers
        for (var i in providers) {
            result.push(ProvidersAPI.getAuthAPI(providers[i].providerName).formatProvider(providers[i]));
        }

        // Sort by order - ascending
        result.sort(function(a, b) {
            return a - b;
        })

        return callback(null, result);
    });
};

/**
 * Delete a provider from the user his/her account
 * @param {number} id
 */
exports.deleteProvider = function(userEntity, providerId, callback) {
    userEntity.removeUserProvider(providerId, function(err) {
        if (err) return callback(err);
        return callback(null, true);
    });
};

/**
 * Update the given provider
 * fields to update:
 * - order
 */
exports.updateProvider = function(userEntity, providerId, newOrder, newProviderTokens, callback) {
    userEntity.hasUserProvider(providerId, function(err, userProvider) {
        if (err) return callback(err);

        // Check the entered parameters
        if (newOrder !== undefined && /[0-9]+/.test(newOrder)) {
            userProvider.order = newOrder;
        }

        if (newProviderTokens != undefined) {
            userProvider.providerTokens = newProviderTokens;
        }

        // Save the user provider
        userProvider.save(function(err) {
            if (err) return callback(err);
            return callback(null, true);
        });
    });
};

/**
 * If we need a request token, call this url (Not all providers support this)
 */
exports.getRequestToken = function(providerName, callback) {
    ProvidersAPI.getAuthAPI(providerName).getRequestToken(function (err, oAuthToken, oAuthTokenSecret) {
        if (err) return callback(err);
        return callback(null, oAuthToken, oAuthTokenSecret);
    });
};

/**
 * Call the provider it's callback function, this will add the provider to the user his/her account
 */
exports.createProvider = function(userEntity, providerName, requestPayload, callback) {
    ProvidersAPI.getAuthAPI(providerName).handleCallback(requestPayload, function (err, providerAccounts) {
        if (err) return callback(err);

        // Check if we got all the parameters
        if (!providerAccounts || !providerAccounts.length) {
            return callback('errors.PROVIDER_CALLBACK_ERROR');
        }

        // For every providerAccount, create a new providerAccount
        var createdProviders = [];

        async.each(providerAccounts, function (providerAccount, asyncCallback) {
            UserProvider.createProviderAccount(userEntity._id, providerName, providerAccount.userId, providerAccount.account, providerAccount.tokens, function(err, createdProvider) {
                if (err) return asyncCallback(err);

                var formattedProvider = ProvidersAPI.getAuthAPI(createdProvider.providerName).formatProvider(createdProvider);
                if (formattedProvider) {
                    createdProviders.push(formattedProvider);
                }

                return asyncCallback();
            });
        }, function(err) {
            if (err) return callback(err);
            return callback(null, createdProviders);
        });
    });
};

/**
 * Get the feed from the user provider, older than a specified time
 */
exports.getOlderFeed = function(userEntity, userProviderId, until, callback) {
    return this.getFeed(userEntity, userProviderId, { until: until }, callback);
};

exports.getNewerFeed = function(userEntity, userProviderId, since, callback) {
    return this.getFeed(userEntity, userProviderId, { since: since }, callback);
};

/**
 * Get the feed from the user provider
 */
exports.getFeed = function(userEntity, userProviderId, options, callback) {
    // Options is optional
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    // Default options
    options = options || {};
    options.since = options.since || null;
    options.until = options.until || null;

    var self = this;

    // Check if we got the given provider
    userEntity.hasUserProvider(userProviderId, function(err, userProvider) {
        if (err) return callback(err);

        var providerName = userProvider.providerName;

        // Get the Feed
        ProvidersAPI.getFeedAPI(providerName).getFeed(userProvider, options.since, options.until, 30, function (err, posts) {
            if (err) return callback(err);
            return callback(null, posts);
        });
    });
};


/**
 * Gets the pages of the given userProvider
 * @param {object} request
 * @param {object} reply
 */
exports.getPages = function(userEntity, userProviderId, callback) {
    var self = this;

    // Check if we got the given provider
    userEntity.hasUserProvider(userProviderId, function(err, userProvider) {
        if (err) return callback(err);

        var providerName = userProvider.providerName;

        ProvidersAPI.getPagesAPI(providerName).getPages(userProvider, function (err, pages) {
            if (err) return callback(err);
            return callback(null, pages);
        });
    });
};

exports.getNewerNotifications = function(userEntity, userProviderId, since, callback) {
    return this.getNotifications(userEntity, userProviderId, { since: since }, callback);
};

/**
 * Get the notifications from the user provider
 * @param Object request
 * @param Function reply
 */
exports.getNotifications = function(userEntity, userProviderId, options, callback) {
    // Options is optional
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    // Default options
    options = options || {};
    options.since = options.since || null;
    options.until = options.until || null;
    options.limit = options.limit || 30;

    var self = this;

    // Check if we got the given provider
    userEntity.hasUserProvider(userProviderId, function(err, userProvider) {
        if (err) return callback(err);

        var providerName = userProvider.providerName;

        // Get the Feed
        ProvidersAPI.getNotificationAPI(providerName).getNotifications(userProvider, options.since, options.limit, function (err, notifications) {
            // Get notification statuses from the database
            Notification.getNotificationsByProviderId(userProvider._id, function(err, results) {
                if (err) return callback(msgFormatted.getError('DatabaseException', 'DATABASE_SELECT_ERROR', 4028, null));

                // Change notification read status
                for (var i in notifications) {
                    for (var j in results) {
                        if (notifications[i].id == results[j].notificationId) {
                            notifications[i].read = results[j].read;
                        }
                    }
                }

                // Return result
                return callback(null, notifications);
            });
        });
    });
};

exports.getPost = function(userEntity, userProviderId, postId, callback) {
    var self = this;

    // Check if we got the given provider
    userEntity.hasUserProvider(userProviderId, function(err, userProvider) {
        if (err) return callback(err);

        var providerName = userProvider.providerName;

        ProvidersAPI.getFeedAPI(providerName).getPost(userProvider, postId, function (err, post) {
            if (err) return callback(err);
            return callback(null, post);
        });
    });
};

exports.getPostComments = function(userEntity, userProviderId, postId, beforeTime, limit, userId, callback) {
    var self = this;

    // Check if we got the given provider
    userEntity.hasUserProvider(userProviderId, function(err, userProvider) {
        if (err) return callback(err);

        var providerName = userProvider.providerName;

        ProvidersAPI.getFeedAPI(providerName).getPostComments(userProvider, postId, beforeTime, limit, userId, function (err, providerId, postId, comments, parentComments, hasMoreComments, postLink) {
            if (err) return callback(err);
            return callback(null, providerId, postId, comments, parentComments, hasMoreComments, postLink);
        });
    });
};

exports.doAction = function(userEntity, userProviderId, actionMethod, payloadData, callback) {
    var self = this;

    // Check if we got the given provider
    userEntity.hasUserProvider(userProviderId, function(err, userProvider) {
        if (err) return callback(err);
        if (!userProvider) return callback('errors.PROVIDER_NOT_FOUND');

        var providerName = userProvider.providerName;

        ProvidersAPI.getActionAPI(providerName).doAction(userProvider, actionMethod, payloadData, function(err, result) {
            if (err) return callback(err);
            return callback(null, result);
        });
    });
};
