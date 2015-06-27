var async = require('async');

function NotificationAPI() {
    this.name = 'NotificationAPI';
    this.strategy = null;
};

NotificationAPI.prototype.use = function(providerStrategy) {
    this.strategy = providerStrategy;
};

/**
 * Get the notifications for the given UserProvider, Also automatically parse it to the unified format
 * @param {object} userProvider
 * @param {int} timeSince
 * @param {int} limit
 * @param {object} callback
 */
NotificationAPI.prototype.getNotifications = function(userProvider, timeSince, limit, notificationCallback) {
    var self = this;

    async.waterfall([
        // Get Notifications
        function(callback){
            self.strategy.getNotifications(userProvider, timeSince, limit, function(err, notifications) {
                if (err) return callback(err);
                return callback(null, notifications);
            });
        },
        // Process posts through their processNotification algorithm
        function(notifications, callback) {
            if (!notifications) return callback("Notifications is undefined");
            // Process all notifications
            async.map(notifications, function(notification, cb) {
                if (!notification) return cb(null, null);
                var transformedNotification = self.processNotification(notification, userProvider);
                return cb(null, transformedNotification);
            }, function(err, transformedNotifications) {
                if (err) return callback(err);
                return callback(null, transformedNotifications);
            });
        },
        // Remove posts that are null
        function(notifications, callback) {
            async.filter(notifications, function(notification, cb) {
                if (notification == null || undefined) return cb(false);
                return cb(true);
            }, function(notifications) {
                return callback(null, notifications);
            });
        },
    ],
    // optional callback
    function(err, notifications){
        if (err) return notificationCallback(err);

        // Sort the posts descending
        notifications = notifications.sort(function(a, b) {
            return new Date(b.created_time) - new Date(a.created_time)
        });

        // Return the posts
        return notificationCallback(null, notifications);
    });
};

NotificationAPI.prototype.processNotification = function(notification, accessToken) {
    return this.strategy.processNotification(notification, accessToken);
};

module.exports = NotificationAPI;
