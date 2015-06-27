// Libraries
var mongoose                = require('mongoose');
var should                  = require('should');
var request                 = require('supertest');
var async                   = require('async');
var Joi                     = require('joi');
var jsondiffpatch 		    = require('jsondiffpatch')

// Feedient
var config                  = require('../../../../config/app');
var mocks                   = require('../../../utils/mocks/index');

// Fixtures
var userProvidersFixture    = require("../../../utils/fixtures/userproviders");

var notificationSchema      = require('../../../../src/schemas/notification');
var NotificationAPI         = require('../../../../src/strategies/notification');
var AuthStrategy            = require('../../../../src/strategies/provider/auth/facebook');
var NotificationStrategy    = require('../../../../src/strategies/provider/notification/facebook');
var notificationsResult     = require('../../../utils/json/facebook/feedient_response/notifications.json');

/**
* API Server Configuration
*/
var api_url             = 'http://127.0.0.1:' + process.env.NODE_PORT || 8001;
var db;

// Options for the SJON comparator
var jsondiffpatchOptions = {
    objectHash: function(obj) {
        return obj._id || obj.id || obj.name || true;
    },
    arrays: {
        // default true, detect items moved inside the array (otherwise they will be registered as remove+add)
        detectMove: true,
        // default false, the value of items moved is not included in deltas
        includeValueOnMove: false
    },
    textDiff: {
        // default 60, minimum string length (left and right sides) to use text diff algorythm: google-diff-match-patch
        minLength: 60
    }
};

describe('Facebook Notification Test', function() {
    describe('calling getNotifications', function () {
        it('should get the notifications', function (done) {
            var userProvider = userProvidersFixture[4];
            var sinceId = null;
            var limit = 30;
            var providerName = userProvider.providerName;

            var notificationService = new NotificationAPI();
            notificationService.use(new NotificationStrategy(new AuthStrategy(config.providers[providerName]), config.providers[providerName]));
            notificationService.getNotifications(userProvider, sinceId, limit, function (err, result) {
                async.each(result, function (notification, callback) {
                    Joi.validate(notification, notificationSchema, function(err, value) {
                        if (err) return callback(err);
                        return callback();
                    });
                }, function (err) {
                    should.not.exist(err);

                    var diffpatcher = jsondiffpatch.create(jsondiffpatchOptions);

                    // Fix the dates
                    result = JSON.parse(JSON.stringify(result), jsondiffpatch.dateReviver);
                    postsResult = JSON.parse(JSON.stringify(notificationsResult), jsondiffpatch.dateReviver);

                    // Diff the jsons
                    var delta = diffpatcher.diff(result, postsResult);
                    jsondiffpatch.console.log(delta);
                    should(delta).not.be.ok;
                    done();
                });
            });
        });
    });
});
