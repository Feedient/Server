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

/**
* API Server Configuration
*/
var api_url             = 'http://127.0.0.1:' + process.env.NODE_PORT || 8001;
var db, user;

describe('User Model Test', function() {
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

    describe('calling hasUserProvider', function() {
        it('should return the userProvider if we own it', function(done) {
            user.hasUserProvider(userProvidersFixture[0]._id, function(err, userProvider) {
                should.not.exist(err);
                should.exist(userProvider);
                userProvider.userId.toString().should.be.equal(user._id.toString());

                done();
            });
        });

        it('should return an error if we don\'t own it', function(done) {
            user.hasUserProvider(userProvidersFixture[5]._id, function(err, userProvider) {
                should.exist(err);
                should.not.exist(userProvider);
                err.should.equal('errors.PROVIDER_NOT_FOUND');

                done();
            });
        });
    });

    describe('calling getEmail', function () {
        it('should get the email', function (done) {
            UserModel.findByEmail(usersFixture[1].email, function(err, user) {
                should.not.exist(err);
                user.email.should.equal(usersFixture[1].email);
                done();
            });
        });

        it('should return null on err and user if no user found', function(done) {
            var request = {
                auth: {
                    credentials: user
                },
                payload: {
                    password: "user123"
                }
            };

            AccountAPI.removeAccount(request, function(reply) {
                UserModel.findByEmail(usersFixture[1].email, function(err, user) {
                    should.not.exist(err);
                    should.not.exist(user);
                    done();
                });
            });
        });
    });
});
