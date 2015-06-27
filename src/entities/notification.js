'use strict';

var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var NotificationSchema = new Schema({
    notificationId: { type: String, required: true },
    providerId: { type: ObjectId, required: true },
    read: { type: Number, required: true, default: 1 },
    dateAdded: { type: Date, required: true, default: Date.now }
});

NotificationSchema.statics.getNotificationsByProviderId = function(providerId, callback) {
    this.find({ providerId: mongoose.Types.ObjectId(providerId) }, function(err, results) {
        if (err) return callback('errors.DATABASE_SELECT_ERROR');
        return callback(null, results);
    });
};

NotificationSchema.statics.getNotificationsRead = function(notificationIds, callback) {
    this.find({ notificationId: { '$in': notificationIds } }, function(err, results) {
        if (err) return callback('errors.DATABASE_SELECT_ERROR');
        return callback(null, results);
    });
};

module.exports = mongoose.model('Notification', NotificationSchema);
