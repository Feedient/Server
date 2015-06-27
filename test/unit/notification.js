// Libraries
var mongoose                = require('mongoose');
var should                  = require('should');
var request                 = require('supertest');
var async                   = require('async');
var Joi                     = require('joi');

// Feedient
var config                  = require('../../config/app');

// Fixtures
var fixtureManager          = require('../utils/fixtureManager');

var NotificationApi         = require('../../src/controllers/notification');

/**
* API Server Configuration
*/
var api_url             = 'http://127.0.0.1:' + process.env.NODE_PORT || 8001;
var db;

describe('Notification Read Test', function() {
    before(function(done) {
        fixtureManager.reset(config, done);
    });

    afterEach(function(done) {
        fixtureManager.reset(config, done);
    });

    describe('calling insertNotification', function () {
        it('should return the notification_id 1', function (done) {
            NotificationApi.insertNotifications({ payload: { notifications: ["1"], providerId: "1w5d9e8a7d9e" }}, function(reply) {
                (reply.error == null).should.be.ok;
                reply.notifications.length.should.be.equal(1);
                reply.notifications.should.containEql("1");
                done();
            });
        });

        it('should return the notifications', function (done) {
            NotificationApi.insertNotifications({ payload: { notifications: ["18thy", "1dawd65aw6d", "1dwq5d4q687d8e", "1v21b5fg4n"], providerId: "1w5d9e8a7d9e" }}, function(reply) {
                (reply.error == null).should.be.ok;
                reply.notifications.length.should.be.equal(4);
                reply.notifications.should.containEql("18thy");
                reply.notifications.should.containEql("1v21b5fg4n");
                reply.notifications.should.containEql("1dawd65aw6d");
                reply.notifications.should.containEql("1dwq5d4q687d8e");
                done();
            });
        });

        it('should return the notifications on duplicate', function (done) {
            NotificationApi.insertNotifications({ payload: { notifications: ["18thy", "18thy"], providerId: "1w5d9e8a7d9e" }}, function(reply) {
                (reply.error == null).should.be.ok;
                reply.notifications.length.should.be.equal(2);
                reply.notifications.should.containEql("18thy");
                done();
            });
        });
    });

    describe('calling getNotification', function() {
        it('should return the notifcation_id if it has been inserted', function(done) {
            NotificationApi.insertNotifications({ payload: { notifications: ["1awadw5698"], providerId: "536f9a4658992b80138ab919" }}, function(reply) {
                (reply.error == null).should.be.ok;
                reply.notifications.length.should.be.equal(1);
                reply.notifications.should.containEql("1awadw5698");

                NotificationApi.getNotificationsByProviderId({ params: { providerId: "536f9a4658992b80138ab919" }}, function(reply) {
                    reply.should.be.instanceOf(Array);
                    reply[0].notificationId.should.equal("1awadw5698");
                    reply[0].providerId.toString().should.equal("536f9a4658992b80138ab919");
                    reply[0].read.should.equal(1);

                    reply.length.should.equal(1);
                    done();
                });
            });
        });

        it('should have size 2 on 2 notifications', function(done) {
            NotificationApi.insertNotifications({ payload: { notifications: ["1awadw5698", "568dwade"], providerId: "536f9a4658992b80138ab919" }}, function(reply) {
                (reply.error == null).should.be.ok;
                reply.notifications.length.should.be.equal(2);
                reply.notifications.should.containEql("1awadw5698");
                reply.notifications.should.containEql("568dwade");

                NotificationApi.getNotificationsByProviderId({ params: { providerId: "536f9a4658992b80138ab919" }}, function(reply) {
                    reply.should.be.instanceOf(Array);

                    reply.should.containDeep([{ notificationId: "1awadw5698" }]);
                    reply.should.containDeep([{ notificationId: "568dwade" }]);

                    reply.length.should.equal(2);
                    done();
                });
            });
        });
    });
});
