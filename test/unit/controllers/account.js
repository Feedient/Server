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
var UserSessionModel        = require('../../../src/entities/userSession');

var AccountAPI              = require('../../../src/controllers/account');
var MailAPI                 = require('../../../src/controllers/mail');

var accountService          = require('../../../src/services/account');

/**
* API Server Configuration
*/
var api_url             = 'http://127.0.0.1:' + process.env.NODE_PORT || 8001;
var db, user;

describe('Account Controller Test', function() {
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

    describe('calling create', function() {
        it('should create an account with the given user and password', function(done) {
            accountService.create('someemail@email.com', 'somePassword', function(err, newUser) {
                should.exist(newUser);
                newUser.email.should.equal('someemail@email.com');

                // Check if the email exists in the db
                UserModel.findOne({ email: 'someemail@email.com' }, function(err, foundUser) {
                    should.exist(foundUser);
                    foundUser.email.should.equal('someemail@email.com');
                    done();
                });
            });
        });
    });

    describe('calling removeUser', function () {
        it('should remove the user + usersessions', function (done) {
            var request = {
                auth: {
                    credentials: user
                },
                payload: {
                    password: "user123"
                }
            };

            AccountAPI.removeAccount(request, function(reply) {
                // check if success = true
                should.not.exist(reply.error);
                should.exist(reply.success);
                reply.success.should.equal(true);

                // Check if user isDeleted == true
                UserModel.findOne({ _id: user._id }, function(err, foundUser) {
                    should.not.exist(err);
                    foundUser.isDeleted.should.equal(true);
                    should.exist(foundUser.deleteDate);

                    // Check if userSessions are gone
                    UserSessionModel.find({ userId: user._id }, function(err, results) {
                        results.length.should.equal(0);
                        done();
                    });
                });
            });
        });

        it('should not remove the user if the user\'s password is wrong', function(done) {
            var request = {
                auth: {
                    credentials: user
                },
                payload: {
                    password: "user12"
                }
            };

            AccountAPI.removeAccount(request, function(reply) {
                // check if success = true
                should.exist(reply.error);
                should.not.exist(reply.success);

                // Check if user isDeleted == false
                UserModel.findOne({ _id: user._id }, function(err, foundUser) {
                    should.not.exist(err);
                    foundUser.isDeleted.should.equal(false);
                    should.not.exist(foundUser.deleteDate);
                    done();
                });
            });
        });

        it('should return account not found on authorize if isDeleted == true', function(done) {
            var request = {
                auth: {
                    credentials: user
                },
                payload: {
                    password: "user123"
                }
            };

            AccountAPI.removeAccount(request, function(reply) {
                UserModel.authenticateManually(user._id, null, null, function(err, user, token) {
                    should.exist(err);
                    should.not.exist(user);
                    should.not.exist(token);
                    done();
                });
            });
        });

        it('should return account not found on recover email if isDeleted == true', function(done) {
            var request = {
                auth: {
                    credentials: user
                },
                payload: {
                    password: "user123"
                }
            };

            var mailRequest = {
                payload: {
                    email: user.email
                }
            };

            AccountAPI.removeAccount(request, function(reply) {
                should.exist(reply);
                reply.success.should.equal(true);
                MailAPI.recoverPasswordConfirmEmail(mailRequest, function(reply) {
                    should.exist(reply);
                    should.exist(reply.error);
                    done();
                });
            });
        });
    });
});
