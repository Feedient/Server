var NotificationEntity = require('../entities/notification');
var async           = require('async');
var mongoose        = require('mongoose');
var msgFormatter    = require('../lib/msgFormatter');
var config          = require('../../config/app');

var Notification = function() {

};

exports.insertNotifications = function (notifications, providerId, callback) {
    var notificationsSaved = [];

    async.each(notifications, function(notificationId, asyncCallback) {
        // Create a new notification
        var notificationObject = new NotificationEntity({
            notificationId: notificationId,
            providerId: mongoose.Types.ObjectId(providerId)
        });

        // Save the notification
        notificationObject.save(function(err) {
            if (err) return callback('errors.DATABASE_SAVE_ERROR');
            notificationsSaved.push(notificationId);
            return asyncCallback(null);
        });
    }, function(err) {
        if (err) return callback(err);
        return callback(null, { notifications: notificationsSaved });
    });
};

exports.getNotificationsByProviderId = function(providerId, callback) {
    NotificationEntity.find({ providerId: mongoose.Types.ObjectId(providerId) }, function(err, results) {
        if (err) return callback('errors.DATABASE_SELECT_ERROR');
        return callback(null, results);
    });
};
