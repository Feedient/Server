var async 		    = require('async');
var fs              = require('fs');
var msgFormatter    = require('../lib/msgFormatter');
var config          = require('../../config/app');
var providerService = require('./provider');
var ObjectId        = require('mongoose').Types.ObjectId

var Stream = function() {
    // Arrays, since multiple providers
    this._feedSince = {};
    this._notificationSince = {};
};

Stream.prototype.getStream = function(conn, userEntity, userProvider) {
    var polling = true;
    var timeoutId = null;
    var self = this;
    var providerName = userProvider.providerName;
    var streamTimeout = config.providers[providerName].streamTimeout || 90000; // Default 90 sec

    conn.on('close', function() {
        polling = false;
    });

    // Register the polling loops
    var loop = function() {
        async.parallel([
            function(callback) { self._streamFeedLoop(conn, userEntity, userProvider, callback); }, 		// Feed Stream
            function(callback) { self._streamNotificationsLoop(conn, userEntity, userProvider, callback); } // Notification Stream
        ], function(err, results) {
            if (polling) {
                if (results && results[0] && results[0] != undefined) {
                    self._feedSince[userProvider.providerName] = results[0];
                }

                if (results && results[1] && results[1] != undefined) {
                    self._notificationSince[userProvider.providerName] = results[1];
                }

                clearTimeout(timeoutId);
                timeoutId = setTimeout(loop, streamTimeout);
            }
        });
    };

    // Hacky fix: To avoid duplicates, we load stream immediately, but throw it away
    loop();
};


// Feed Stream
Stream.prototype._streamFeedLoop = function(conn, userEntity, userProvider, callback) {
    var self = this;
    providerService.getNewerFeed(userEntity, userProvider._id, self._feedSince[userProvider.providerName], function (err, posts) {
        if (err) {
            conn.write(JSON.stringify({ error : { message: err }}));
            return callback(err);
        }

        // If we got posts, and the first post it's date_created is bigger then lastCallDate, then write to client
        if (posts && posts.length > 0 && posts[0] && posts[0]['id']) {
            conn.write(JSON.stringify(
                {
                    type: 'post',
                    content: {
                        provider: userProvider._id,
                        posts: posts
                    }
                }
            ));

            // Return the since key
            return callback(null, posts[0]['pagination']['since']);
        }

        return callback();
    });
};

// Notifications Stream
Stream.prototype._streamNotificationsLoop = function(conn, userEntity, userProvider, callback) {
    var self = this;
    providerService.getNewerNotifications(userEntity, userProvider._id, self._notificationSince[userProvider.providerName], function (err, notifications) {
        if (err) {
            conn.write(JSON.stringify({ error : { message: err }}));
            return callback(err);
        }

        if (notifications && notifications.length) {
            conn.write(JSON.stringify(
                {
                    type: 'notification',
                    content: {
                        provider: userProvider._id,
                        notifications: notifications
                    }
                }
            ));

            if (!notifications[0] || !notifications[0]['pagination']) {
                return callback();
            }

            return callback(null, notifications[0]['pagination']['since']);
        }

        return callback();
    });
};

module.exports = Stream;
