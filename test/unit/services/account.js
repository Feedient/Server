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

// Models
var UserModel               = require('../../../src/entities/user');
var UserSessionModel        = require('../../../src/entities/userSession');
var WorkspaceModel          = require('../../../src/entities/workspace');

// Services Used
var accountService          = require('../../../src/services/account');
var workspaceService        = require('../../../src/services/workspace');

/**
* API Server Configuration
*/
var api_url             = 'http://127.0.0.1:' + process.env.NODE_PORT || 8001;
var db, user, admin;

describe('Account Service Test', function() {
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

    describe('calling logout', function() {
        it('should remove all the usersessions from an account', function(done) {
            accountService.logout(userSessionsFixture[1].token, function(err, success) {
                should.exist(success);
                should.not.exist(err);
                success.should.equal(true);

                UserSessionModel.findOne({ token: userSessionsFixture[1].token }, function(err, token) {
                    should.not.exist(err);
                    should.not.exist(token);

                    done();
                });
            });
        });
    });

    describe('calling removeAccount', function() {
        it('should remove the account from the user if the password is correct', function(done) {
            accountService.removeAccount(user, "user123", function(err, success) {
                should.exist(success);
                should.not.exist(err);
                success.should.equal(true);

                // Account isDeleted should be true
                UserModel.findOne({ _id: usersFixture[1]._id }, function(err, user) {
                    should.not.exist(err);
                    should.exist(user);

                    user.isDeleted.should.equal(true);

                    // Account sessions should be deleted
                    UserSessionModel.find({ userId: usersFixture[1]._id }, function(err, tokens) {
                        should.not.exist(err);
                        tokens.length.should.equal(0);

                        done();
                    });
                });
            });
        });

        it('should give an error if the password is wrong', function(done) {
            accountService.removeAccount(user, "wrongpassword", function(err, success) {
                should.not.exist(success);
                should.exist(err);
                err.should.equal('errors.ACCOUNT_PASSWORD_CONFIRM_WRONG');

                UserModel.findOne({ _id: usersFixture[1]._id }, function(err, user) {
                    should.not.exist(err);
                    should.exist(user);
                    user.isDeleted.should.equal(false);

                    done();
                });
            });
        });
    });

    describe('calling authorize', function() {
        var userAgent = 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2049.0 Safari/537.36';

        it('should return the userId and userToken on success', function(done) {
            accountService.authorize(usersFixture[1].email, 'user123', userAgent, 'xforwardedfor', function(err, userId, token) {
                should.not.exist(err);
                should.exist(userId);
                should.exist(token);
                userId.toString().should.equal(usersFixture[1]._id.toString());

                // We should have a session with the given token
                UserSessionModel.findOne({ token: token }, function(err, foundSession) {
                    should.not.exist(err);
                    should.exist(foundSession);
                    foundSession.token.should.equal(token);
                    foundSession.browser.should.equal('Chrome');
                    foundSession.platform.should.equal('Windows');

                    done();
                });
            });
        });

        it('should return an error if the email is wrong', function(done) {
            accountService.authorize(usersFixture[1].email, 'use123', userAgent, 'xforwardedfor', function(err, userId, token) {
                should.exist(err);
                should.not.exist(userId);
                should.not.exist(token);

                err.should.equal('errors.ACCOUNT_PASSWORD_INCORRECT');

                done();
            });
        });
    });

    describe('calling getSessions', function() {
        it('should return the userSessions', function(done) {
            accountService.getSessions(user, function(err, sessions) {
                should.not.exist(err);
                should.exist(sessions);

                (Object.prototype.toString.call(sessions) === '[object Array]').should.be.true;
                done();
            });
        });
    });

    describe('calling removeSession', function() {
        it('should remove the session', function(done) {
            accountService.removeSession(user, userSessionsFixture[1].token, function(err, success) {
                should.not.exist(err);
                should.exist(success);
                success.should.equal(true);

                UserSessionModel.findOne({ token: userSessionsFixture[1].token }, function(err, foundSession) {
                    should.not.exist(err);
                    should.not.exist(foundSession);

                    done();
                });
            });
        });

        it('should return false if the session does not exist', function(done) {
            accountService.removeSession(user, '65sd6asw56d5aw6d', function(err, success) {
                should.not.exist(err);
                should.exist(success);
                success.should.equal(false);

                done();
            });
        });

        it('should return false if we do not have access too this token', function(done) {
            accountService.removeSession(user, userSessionsFixture[0].token, function(err, success) {
                should.not.exist(err);
                should.exist(success);
                success.should.equal(false);

                done();
            });
        });
    });

    describe('calling create', function() {
        it('should create an account if success and return it', function(done) {
            accountService.create('test@test.be', 'test123', function(err, account) {
                should.not.exist(err);
                should.exist(account);
                account.email.should.equal('test@test.be');

                done();
            });
        });

        it('should return errors.ACCOUNT_EMAIL_EXISTS if the email already exists', function(done) {
            accountService.create('test@test.be', 'test123', function(err, account) {
                should.not.exist(err);
                should.exist(account);
                account.email.should.equal('test@test.be');

                accountService.create('test@test.be', 'test123', function(err, account) {
                    should.exist(err);
                    should.not.exist(account);
                    err.should.equal('errors.ACCOUNT_EMAIL_EXISTS');

                    done();
                });
            });
        });
    });

    describe('calling createInvitationKey', function() {
        it('should return the key on success', function(done) {
            accountService.createInvitationKey('SOMERANDOMKEY', 5, function(err, object) {
                should.not.exist(err);
                should.exist(object);

                object.key.should.equal('SOMERANDOMKEY');
                object.usages.should.equal(5);

                done();
            });
        });

        it('should return usages 1 if no usage amount given', function(done) {
            accountService.createInvitationKey('SOMERANDOMKEY', function(err, object) {
                should.not.exist(err);
                should.exist(object);

                object.key.should.equal('SOMERANDOMKEY');
                object.usages.should.equal(1);

                done();
            });
        });
    });

    describe('calling getAccount', function() {
        it('should get the account details _id, email, role', function(done) {
            accountService.get(usersFixture[1], function(err, account) {
                should.exist(account);
                should.not.exist(err);

                account._id.should.equal(usersFixture[1]._id);
                account.email.should.equal(usersFixture[1].email);
                account.role.should.equal(usersFixture[1].role);
                account.language.should.equal(usersFixture[1].language);
                account.last_login.should.exist;

                done();
            });
        });
    });

    describe('calling updatePassword', function() {
        it('should update the password', function(done) {
            accountService.updatePassword(user, 'user123', 'random', 'random', 'useragent', 'frwarded', function(err, uid, newToken) {
                should.exist(uid);
                should.exist(newToken);
                should.not.exist(err);

                uid.toString().should.equal(user._id.toString());

                user.comparePassword('random', function(err, isMatch) {
                    should.exist(isMatch);
                    should.not.exist(err);
                    isMatch.should.equal(true);
                    done();
                });
            });
        });

        it('should return an error if the old password doesn\'t match', function(done) {
            accountService.updatePassword(user, 'use23', 'random', 'random', 'useragent', 'frwarded', function(err, uid, newToken) {
                should.not.exist(uid);
                should.not.exist(newToken);
                should.exist(err);

                err.should.equal('errors.ACCOUNT_PASSWORD_INCORRECT');

                done();
            });
        });
    });

    describe('calling updateLanguage', function() {
        it('should update the language', function(done) {
            accountService.updateLanguage(user, 'en_GB', function(err, isSuccess) {
                should.not.exist(err);
                should.exist(isSuccess);

                isSuccess.should.equal(true);

                done();
            });
        });

        it('should return errors.ACCOUNT_UPDATE_LANGUAGE_NOT_FOUND if the language is not found', function(done) {
            accountService.updateLanguage(user, 'nonexistinglanguage', function(err, result) {
                should.not.exist(result);
                should.exist(err);

                err.should.equal('errors.ACCOUNT_UPDATE_LANGUAGE_NOT_FOUND');

                done();
            })
        });
    });
});
