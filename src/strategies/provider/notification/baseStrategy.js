'use strict';

function BaseStrategy() {

};

/**
 * Gets the user his/her notifications
 */
BaseStrategy.prototype.getNotifications = function(userProvider, timeSince, limit, callback) {
    return callback(null, []);
};

/**
 * Process the notification to a unified format
 */
BaseStrategy.prototype.processNotification = function(notification, userProvider) {
    return {};
};


module.exports = BaseStrategy;
