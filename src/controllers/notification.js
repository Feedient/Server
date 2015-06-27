var async           = require('async');
var mongoose        = require('mongoose');
var Notification    = require('../services/notification');
var msgFormatter    = require('../lib/msgFormatter');
var config          = require('../../config/app');

exports.insertNotifications = function (request, reply) {
    var notifications = request.payload.notifications;
    var providerId = request.payload.providerId;

    Notification.insertNotifications(notifications, providerId, function(err, result) {
        if (err) return reply({ error: err });
        return reply(result);
    });
};

exports.getNotificationsByProviderId = function(request, reply) {
    var providerId = request.params.providerId;

    Notification.getNotificationsByProviderId(providerId, function(err, result) {
        if (err) return reply({ error: err });
        return reply(result);
    });
};
