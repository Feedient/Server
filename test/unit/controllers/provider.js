// Libraries
var mongoose                = require('mongoose');
var should                  = require('should');
var request                 = require('supertest');
var async                   = require('async');
var Joi                     = require('joi');
var jsondiffpatch 		    = require('jsondiffpatch')

// Feedient
var config                  = require('../../../config/app');
var mocks                   = require('../../utils/mocks/index');

// Fixtures
var fixtureManager          = require('../../utils/fixtureManager');
var userProvidersFixture    = require("../../utils/fixtures/userproviders");
var userSessionsFixture     = require("../../utils/fixtures/usersessions");
var usersFixture            = require("../../utils/fixtures/users");
var workspaceFixture        = require("../../utils/fixtures/workspaces");

var UserModel               = require('../../../src/entities/user');

var ProviderAPI             = require('../../../src/controllers/provider');

var notificationSchema      = require('../../../src/schemas/notification');
var pageSchema              = require('../../../src/schemas/page');
var providerSchema          = require('../../../src/schemas/userProvider');

var notificationsResult     = require('../../utils/json/controllers/provider/getNotifications.json');
var providersResult         = require('../../utils/json/controllers/provider/getProviders.json');
var providerResult          = require('../../utils/json/controllers/provider/getProvider.json');
var pageResult              = require('../../utils/json/controllers/provider/getPages.json');
var createFacebookProviderResult = require('../../utils/json/controllers/provider/createFacebookProvider.json');

/**
* API Server Configuration
*/
var api_url             = 'http://127.0.0.1:' + process.env.NODE_PORT || 8001;
var db, user;

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

describe('Provider Controller Test', function() {
    before(function(done) {
        fixtureManager.reset(config, done);
    });

    beforeEach(function(done) {
        fixtureManager.seed(config, [
            { name: "users", data: usersFixture },
            { name: "usersessions", data: userSessionsFixture },
            { name: "userproviders", data: userProvidersFixture },
            { name: "workspaces", data: workspaceFixture }
        ], function() {
            // Load the user
            UserModel.findOne({ _id: usersFixture[1]._id }, function(err, foundUser) {
                user = foundUser;

                // Load the admin
                UserModel.findOne({ _id: usersFixture[0]._id }, function(err, foundUser) {
                    admin = foundUser;

                    done();
                });
            });
        });
    });

    afterEach(function(done) {
        fixtureManager.reset(config, done);
    });

    describe('calling createProvider', function () {
        it('should create a new facebook provider for the name facebook', function (done) {
            var oauthCode = "OAUTHCODEV1";

            var request = {
                auth: {
                    credentials: user
                },
                params: {
                    name: "facebook"
                },
                payload: {
                    oauth_code: oauthCode
                }
            };

            ProviderAPI.createProvider(request, function(reply) {
                reply.length.should.equal(1);

                async.each(reply, function (providerAcc, callback) {
                    Joi.validate(providerAcc, providerSchema, function(err, value) {
                        if (err) return callback(err);
                        return callback();
                    });
                }, function (err) {
                    should.not.exist(err);
                    var diffpatcher = jsondiffpatch.create(jsondiffpatchOptions);

                    // Set the dates and ids to fixed since we create them on test run
                    reply[0].date_added = "2014-07-12T17:05:09.804Z";
                    reply[0].id = "53c16ac586013bf909d99c0c";

                    // Fix the dates
                    var result = JSON.parse(JSON.stringify(reply), jsondiffpatch.dateReviver);
                    createFacebookProviderResult = JSON.parse(JSON.stringify(createFacebookProviderResult), jsondiffpatch.dateReviver);

                    // Diff the jsons
                    var delta = diffpatcher.diff(result, createFacebookProviderResult);
                    jsondiffpatch.console.log(delta);
                    should(delta).not.be.ok;
                    done();
                });
            });
        });

        it('should update the accessToken on adding the same provider again', function (done) {
            var oauthCode = "OAUTHCODEV1";

            var request = {
                auth: {
                    credentials: user
                },
                params: {
                    name: "facebook"
                },
                payload: {
                    oauth_code: oauthCode
                }
            };

            ProviderAPI.createProvider(request, function(reply) {
                reply.length.should.equal(1);

                async.each(reply, function (providerAcc, callback) {
                    Joi.validate(providerAcc, providerSchema, function(err, value) {
                        if (err) return callback(err);
                        return callback();
                    });
                }, function (err) {
                    should.not.exist(err);
                    var diffpatcher = jsondiffpatch.create(jsondiffpatchOptions);

                    // Set the dates and ids to fixed since we create them on test run
                    reply[0].date_added = "2014-07-12T17:05:09.804Z";
                    reply[0].id = "53c16ac586013bf909d99c0c";

                    // Fix the dates
                    var result = JSON.parse(JSON.stringify(reply), jsondiffpatch.dateReviver);
                    createFacebookProviderResult = JSON.parse(JSON.stringify(createFacebookProviderResult), jsondiffpatch.dateReviver);

                    // Diff the jsons
                    var delta = diffpatcher.diff(result, createFacebookProviderResult);
                    jsondiffpatch.console.log(delta);
                    should(delta).not.be.ok;

                    // READD PROVIDER
                    var oauthCode = "OAUTHCODEV1";

                    var request = {
                        auth: {
                            credentials: user
                        },
                        params: {
                            name: "facebook"
                        },
                        payload: {
                            oauth_code: oauthCode
                        }
                    };

                    ProviderAPI.createProvider(request, function(reply) {
                        reply.length.should.equal(0); // 0 Since we updated
                        done();
                    });
                });
            });
        });
    });

    describe('calling getProvider', function() {
        it('should get the provider with the specified id', function(done) {
            var request = {
                auth: {
                    credentials: user
                },
                params: {
                    id: userProvidersFixture[3]._id
                }
            };

            ProviderAPI.getProvider(request, function(reply) {
                Joi.validate(reply, providerSchema, function(err, value) {
                    should.not.exist(err);

                    var diffpatcher = jsondiffpatch.create(jsondiffpatchOptions);

                    // Fix the dates
                    var result = JSON.parse(JSON.stringify(reply), jsondiffpatch.dateReviver);
                    providerResult = JSON.parse(JSON.stringify(providerResult), jsondiffpatch.dateReviver);

                    // Diff the jsons
                    var delta = diffpatcher.diff(result, providerResult);
                    jsondiffpatch.console.log(delta);
                    should(delta).not.be.ok;
                    done();
                });
            });
        });
    });

    describe('calling getProviders', function() {
        it('should get the providers for that user', function(done) {
            var request = {
                auth: {
                    credentials: user
                }
            };

            ProviderAPI.getProviders(request, function(reply) {
                reply.length.should.equal(5);

                async.each(reply, function (provider, callback) {
                    Joi.validate(provider, providerSchema, function(err, value) {
                        if (err) return callback(err);
                        return callback();
                    });
                }, function (err) {
                    should.not.exist(err);
                    var diffpatcher = jsondiffpatch.create(jsondiffpatchOptions);

                    // Fix the dates
                    var result = JSON.parse(JSON.stringify(reply), jsondiffpatch.dateReviver);
                    providersResult = JSON.parse(JSON.stringify(providersResult), jsondiffpatch.dateReviver);

                    // Diff the jsons
                    var delta = diffpatcher.diff(result, providersResult);
                    jsondiffpatch.console.log(delta);
                    should(delta).not.be.ok;
                    done();
                });
            });
        });
    });

    // describe('calling getNotification', function () {
    //     it('should get the notifications for that userprovider', function (done) {
    //         var request = {
    //             auth: {
    //                 credentials: user
    //             },
    //             params: {
    //                 userProviderId: userProvidersFixture[3]._id
    //             }
    //         };
    //
    //         ProviderAPI.getNotifications(request, function (reply) {
    //             should.exist(reply.provider);
    //             should.exist(reply.notifications);
    //
    //             async.each(reply.notifications, function (notification, callback) {
    //                 Joi.validate(notification, notificationSchema, function(err, value) {
    //                     if (err) return callback(err);
    //                     return callback();
    //                 });
    //             }, function (err) {
    //                 should.not.exist(err);
    //                 var diffpatcher = jsondiffpatch.create(jsondiffpatchOptions);
    //
    //                 // Fix the dates
    //                 var result = JSON.parse(JSON.stringify(reply), jsondiffpatch.dateReviver);
    //                 notificationsResult = JSON.parse(JSON.stringify(notificationsResult), jsondiffpatch.dateReviver);
    //
    //                 // Diff the jsons
    //                 var delta = diffpatcher.diff(result, notificationsResult);
    //                 jsondiffpatch.console.log(delta);
    //                 should(delta).not.be.ok;
    //                 done();
    //             });
    //         });
    //     });
    // });

    describe('calling getPages', function() {
        it ('shoult get the pages for that userProvider', function(done) {
            var request = {
                auth: {
                    credentials: user
                },
                params: {
                    userProviderId: userProvidersFixture[4]._id
                }
            };

            ProviderAPI.getPages(request, function(reply) {
                async.each(reply, function(page, callback) {
                    Joi.validate(page, pageSchema, function(err, value) {
                        if (err) return callback(err);
                        return callback();
                    });
                }, function(err) {
                    should.not.exist(err);
                    var diffpatcher = jsondiffpatch.create(jsondiffpatchOptions);

                    // Fix the dates
                    var result = JSON.parse(JSON.stringify(reply), jsondiffpatch.dateReviver);
                    pageResult = JSON.parse(JSON.stringify(pageResult), jsondiffpatch.dateReviver);

                    // Diff the jsons
                    var delta = diffpatcher.diff(result, pageResult);
                    jsondiffpatch.console.log(delta);
                    should(delta).not.be.ok;
                    done();
                });
            });
        });
    });
});
